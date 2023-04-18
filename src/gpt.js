// global.process.env.OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY

import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage, SystemChatMessage } from "langchain/schema";
// import {config} from 'dotenv'
// config()
import { Fireproof, Index, Listener } from "@fireproof/core";
// import { useFireproof, FireproofCtx } from '@fireproof/core/hooks/use-fireproof'

const TEMPERATURE = 0.2

// class HumanChatMessage {}
// class SystemChatMessage {}

// class ChatOpenAI {
//   call() {
//     return {
//       text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, \nsed do eiusmod tempor incididunt ut \nlabore et dolore magna aliqua",
//     };
//   }
// }

export class Discovery {
  constructor() {
    this.db = Fireproof.storage("epiphany");
    window.fireproof = this.db;
    this.typeIndex = new Index(this.db, (doc, map) => map(doc.type, doc));
    this.listener = new Listener(this.db);
    this.doc = { _id: "discovery" };
    this.hydro = false;
    this.personas = [];
  }

  async registerChangeHandler(fn) {
    console.log("registerChangeHandler");
    this.listener.on("*", async () => {
      console.log("op*");
      await this.rehydrate();
      fn();
    });
  }

  async rehydrate() {
    this.hydro = true;
    // load personas from fireproof
    this.personas = await this.loadPersonas();
    this.doc = await this.db
      .get("discovery")
      .catch((e) => ({ _id: "discovery" }));
  }

  async loadPersonas() {
    const res = await this.typeIndex.query({ key: "persona" });
    console.log("personas", res.rows);
    return res.rows.map((r) =>
      Persona.fromDoc(r.value, this.interviewer, this.db)
    );
  }

  personaById(id) {
    console.log(
      id,
      this.personas.map((p) => p.id)
    );
    return this.personas.find((p) => p.id === id);
  }

  async askFollowUps(followups) {
    return await Promise.all(
      this.personas.map(async (p) => await p.askFollowUps(followups))
    );
  }

  async generateCustomers(product, customer, openAIKey) {
    this.doc.product = product;
    this.doc.customer = customer;
    this.doc.openAIKey = openAIKey;
    await this.db.put(this.doc);

    if (!this.interviewer) {
      this.interviewer = new ChatOpenAI({
        temperature: TEMPERATURE,
        openAIApiKey: openAIKey,
      });
    }
    const gptPeople = await this.interviewer.call([
      new SystemChatMessage(
        `You have read The Four Steps to the Epiphany by Steven Gary Blank and you are ready to
        start your first customer interview. You will help gather people to interview and then interview them.
        This is the product you are building: ${product}. The customer you are building for is: ${customer}.`
      ),
      new HumanChatMessage(
        `Based on the product and customer descriptions, give a list of five people that would be interested 
          in this product. Give them memorable names and relevant descriptions. Your output should be in the
          form of a newline-delimited list, with each line looking like \`Talkative Tom: a frontend 
          designer who is always telling his peers about new cool demos on CodePen.\`
          `
      ),
    ]);

    const people = gptPeople.text.split("\n");

    for (const person of people) {
      if (!person) continue;
      const persona = new Persona(
        person,
        this.interviewer,
        this.doc,
        this.db
      );
      await persona.persist();
      this.personas.push(persona);
    }
  }

  async generateInterviewSummary() {
    const summary = await this.interviewer.call([
      new SystemChatMessage(
        "Now that you have interviewed your customers, you have a lot of information. You need to summarize it."
      ),
      // new HumanChatMessage(
      //   'What are the top 3 questions we should ask the next customer we interview?',
      // ),
      new HumanChatMessage(
        "Summarize your conversations, highlighting the customers, use-cases, and features that have the most commercial viability."
      ),
    ]);
    const followUps = await this.interviewer.call([
      new HumanChatMessage(
        "What are the top 3 questions we should ask the next customer we interview?"
      ),
    ]);
    this.doc.interviewSummary = summary.text;
    this.doc.followUps = followUps.text;
    await this.db.put(this.doc);
  }
}

export class Persona {
  static docFields =
    "openAIKey description product customer conversations perspective followUpsAnswer interviewSummary";

  perspective = "";
  constructor(description, interviewer, {product, customer, openAIKey}, db) {
    this.interviewer = interviewer;
    this.openAIKey = openAIKey;
    this.description = description;
    this.didAsk = false;
    this.conversations = [];
    this.product = product;
    this.customer = customer;
    this.id = null;
    this.db = db;
  }

  myChat() { 
    if (this.chat) return this.chat
    this.chat = new ChatOpenAI({
      temperature: TEMPERATURE,
      openAIApiKey: this.openAIKey,
    });
    return this.chat
  }

  displayName() {
    const match =  this.description?.match(/(.*?)[-:]/)
    console.log('match', match, this.description)
    return match && match[1];
  }

  displayAbout() {
    return this.description?.match(/[-:](.*)/)[1];
  }

  static fromDoc(doc, interviewer, db) {
    const persona = new Persona(null, interviewer, doc, db);
    Persona.docFields
      .split(" ")
      .forEach((field) => (persona[field] = doc[field]));
    persona.id = doc._id;
    return persona;
  }

  async persist() {
    const doc = { type: "persona" };
    if (this.id) {
      doc._id = this.id;
    }
    Persona.docFields.split(" ").forEach((field) => {
      if (this[field]) {
        doc[field] = this[field];
      }
    });
    // console.log('persist', doc)
    const resp = await this.db.put(doc);
    // console.log('resp', resp)

    this.id = resp.id;
  }

  async askFollowUps(followups) {
    const qAnswer = await this.myChat().call(new HumanChatMessage(followups));
    this.followUpsAnswer = qAnswer.text;
    await this.persist(this.db);
  }

  //   const product = await ux.prompt('What is the quick elevator pitch for your product.')
  //   const customer = await ux.prompt('Please describe your most clearly understood customer or initial user.')
  //   const channel = await ux.prompt('What is the primary channel through which you will reach your customer?')
  //   const pricing = await ux.prompt('What is the pricing model for your product?')
  //   const problem = await ux.prompt('What is the problem that your customer is trying to solve?')
  //   const dayInLife = await ux.prompt('What is a typical day in the life of your customer?')
  //   const buyerMapPeople = await ux.prompt('Who are the people that influence the buying decision?')
  //   const roiJustification = await ux.prompt('What is the ROI justification for your product?')
  //   const buyingHabits = await ux.prompt('What are the buying habits of your customer? What channels to the puchase through?')

  async doInterview() {
    this.conversations = []; // reset
    await this.pursueQuestions(
      "What are the biggest problems a product like this could help you solve?"
    );
    await this.pursueQuestions("How much does this problem cost you?");
    await this.pursueQuestions("What other solutions are you considering?");
    await this.pursueQuestions(
      "If you could wave a magic wand and change anything about this, what would you do?"
    );
  }

  async pursueQuestions(question, thisConvo = null, rounds = 3) {
    if (rounds < 1) return;
    if (!thisConvo) {
      thisConvo = [];
      this.conversations.push(thisConvo);
    }
    const messages = [];
    if (!this.didAsk) {
      messages.push(
        new SystemChatMessage(
          `You are ${this.description}. We will interview you about ${this.product} 
          designed for someone like ${this.customer}. You have a perspective ${this.perspective}`
        )
      );
      this.didAsk = true;
    }
    messages.push(new HumanChatMessage(question));

    thisConvo.push({ by: "interviewer", text: question });
    await this.persist(this.db);

    const qAnswer = await this.myChat().call(messages);

    thisConvo.push({ by: "persona", text: qAnswer.text });
    await this.persist(this.db);

    const furtherQuestions = await this.interviewer.call([
      new SystemChatMessage(
        `Here is the response from ${this.description} to the question: ${question}. What should we ask them next?`
      ),
      new HumanChatMessage(qAnswer.text),
    ]);
    return this.pursueQuestions(furtherQuestions.text, thisConvo, rounds - 1);
  }

  async summarizeInterview() {
    console.log(this.conversations.toString());
    const qAnswer = await this.myChat().call([
      new SystemChatMessage(
        `Your interview is complete, the interviewer will now ask for a summary. Here is the interview text as a reminder: ${JSON.stringify(
          this.conversations
        )}`
      ),
      new HumanChatMessage(
        "Provide a list of the most important problems Fireproof can solve for you, and the impact the soltuion would have."
      ),
    ]);
    this.interviewSummary = qAnswer.text;
    await this.persist();
  }
}
