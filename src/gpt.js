// import { ChatOpenAI } from "langchain/chat_models/openai";
// import { HumanChatMessage, SystemChatMessage } from "langchain/schema";

import { Fireproof, Index } from "@fireproof/core";
// import { useFireproof, FireproofCtx } from '@fireproof/core/hooks/use-fireproof'

class HumanChatMessage {}
class SystemChatMessage {}

class ChatOpenAI {
  call() {
    return {
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, \nsed do eiusmod tempor incididunt ut \nlabore et dolore magna aliqua",
    };
  }
}

export class Discovery {
  constructor() {
    this.personas = [];
    this.interviewer = new ChatOpenAI({ temperature: 0 });
    this.db = Fireproof.storage("epiphany");
    window.db = this.db
    this.typeIndex = new Index(this.db, (doc, map) => map(doc.type, null));
  }

  async rehydrate() {
    // load personas from fireproof
    this.personas = await this.loadPersonas();
  }

  async loadPersonas() {
    const res = await this.typeIndex.query({ key: "persona" });
    console.log("personas", res.rows);
    return [];
  }

  async askFollowUps(followups) {
    return await Promise.all(
      this.personas.map(async (p) => await p.askFollowUps(followups))
    );
  }

  async generateCustomers(product, customer) {
    const gptPeople = await this.interviewer.call([
      new SystemChatMessage(
        `You have read The Four Steps to the Epiphany by Steven Gary Blank and you are ready to
        start your first customer interview. You will help gather people to interview and then interview them. `
      ),
      new HumanChatMessage(
        `Based on this elevator pitch, and customer description, give a list of five people that would be interested 
          in this product. Give them memorable names and relevant descriptions. Eg: Talkative Tom, a frontend 
          designer who is always telling his peers about new cool demos on CodePen.
          Product pitch: ${product} Customer description: ${customer}`
      ),
    ]);
    this.personas = await Promise.all(
      gptPeople.text.split("\n").map(async (p) => {
        const persona = new Persona(p, this.interviewer, product, customer);
        await persona.persist(this.db);
        return persona;
      })
    );
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
    this.interviewSummary = summary.text;
    const followUps = await this.interviewer.call([
      new HumanChatMessage(
        "What are the top 3 questions we should ask the next customer we interview?"
      ),
    ]);
    this.followUps = followUps.text;
  }
}

export class Persona {
  static docFields =
    "description product customer conversations perspective followUpsAnswer";

  perspective = "";
  constructor(description, interviewer, product, customer) {
    this.interviewer = interviewer;
    this.chat = new ChatOpenAI({ temperature: 0 });
    this.description = description;
    this.didAsk = false;
    this.conversations = [];
    this.product = product;
    this.customer = customer;
    this.id = null;
  }

  static fromDoc(doc, interviewer) {
    const persona = new Persona(null, interviewer);
    Persona.docFields
      .split(" ")
      .forEach((field) => (persona[field] = doc[field]));
    this.id = doc._id;
  }

  async persist(db) {
    const doc = { type: "persona" };
    if (this.id) {
      doc._id = this.id;
    }
    Persona.docFields.split(" ").forEach((field) => {
      if (this[field]) {
        doc[field] = this[field];
      }
    });
    const resp = await db.put(doc);
    this.id = resp.id;
  }

  async askFollowUps(followups) {
    const qAnswer = await this.chat.call(new HumanChatMessage(followups));
    this.followUpsAnswer = qAnswer.text;
  }

  async conductInterview(question, thisConvo = null, rounds = 3) {
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

    const qAnswer = await this.chat.call(messages);

    thisConvo.push({ by: "interviewer", text: question });

    thisConvo.push({ by: "persona", text: qAnswer.text });

    const furtherQuestions = await this.interviewer.call([
      new SystemChatMessage(
        `Here is the response from ${this.description} to the question: ${question}. What should we ask them next?`
      ),
      new HumanChatMessage(qAnswer.text),
    ]);

    return this.conductInterview(furtherQuestions.text, thisConvo, rounds - 1);
  }
}
