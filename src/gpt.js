import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage, SystemChatMessage } from "langchain/schema";
// import { useFireproof, FireproofCtx } from '@fireproof/core/hooks/use-fireproof'
import { Fireproof, Index } from "@fireproof/core";
import { Persona } from "./gpt_persona";

export const TEMPERATURE = 0.2;

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
    // this should useContext or we should just useFireproof ...
    if (window.fireproof) {
      this.db = window.fireproof;
    } else {
      this.db = Fireproof.storage("epiphany-7");
      window.fireproof = this.db;
    }
    // only the fields for the home page
    this.typeIndex = new Index(this.db, (doc, map) => {
      map(doc.type, {
        _id: doc._id,
        interviewSummary: doc.interviewSummary || null,
        description: doc.description || null,
        didInterview: doc.conversations ? doc.conversations.length > 0 : false,
      });
    });
    // this.listener = new Listener(this.db);
    this.doc = { _id: "discovery", product: "", customer: "", openAIKey: "" };
    this.hydro = false;
    this.personas = [];
  }

  // async registerChangeHandler(fn) {
  //   if (this.unlisten) this.unlisten();
  //   this.unlisten = this.listener.on("*", async () => {
  //     // await this.rehydrate();
  //     fn();
  //   });
  // }

  async rehydrate(page) {
    this.hydro = true;
    // load personas from fireproof
    this.personas = await this.loadPersonas(page);
    this.doc = await this.db
      .get("discovery")
      .catch((e) => ({ _id: "discovery" }));
  }

  async loadPersonas(page) {
    // console.log("do query");
    const res = await this.typeIndex.query({ key: "persona" });
    // console.log("personas", res.rows);
    return await Promise.all(
      res.rows.map(async (r) => {
        if (page !== "home") {
          const doc = await this.db.get(r.id);
          return Persona.fromDoc(doc, this.db);
        } else {
          // no conversations on home page
          return Persona.fromDoc(r.value, this.db);
        }
      })
    );
  }

  async resetPersonas() {
    const res = await this.typeIndex.query({ key: "persona" });
    this.personas = [];
    await Promise.all(res.rows.map(async (r) => this.db.del(r.value._id)));
  }

  async personaById(id) {
    const doc = await this.db.get(id);
    return Persona.fromDoc(doc, this.db);
  }

  async askFollowUps() {
    this.personas = await this.loadPersonas();
    return await Promise.all(
      this.personas.map(async (p) => await p.askFollowUps(this.doc.followUps))
    );
  }

  bigInterviewer() {
    if (this.interviewer) return this.interviewer;
    const api = new ChatOpenAI({
      temperature: TEMPERATURE,
      openAIApiKey: this.doc.openAIKey,
    });
    this.interviewer = {
      call: async (msgs) => {
        const res = api.call(msgs);
        return res;
      },
    };
    return this.interviewer;
  }

  async generateCustomers(product, customer, openAIKey) {
    this.doc.product = product;
    this.doc.customer = customer;
    this.doc.openAIKey = openAIKey;
    await this.db.put(this.doc);

    const gptPeople = await this.bigInterviewer().call([
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
      if (/^\s*$/.test(person)) continue;
      if (!/[-:]/.test(person)) {
        console.log("need to parse", person);
        continue;
      }
      // consoloe.log("person", person);
      const persona = new Persona(person, this.doc, this.db);
      await persona.persist();
      this.personas.push(persona);
    }
  }

  async generateInterviewSummary() {
    this.loadPersonas()
    const summary = await this.bigInterviewer().call([
      new SystemChatMessage(
        `Now that you have interviewed your customers, you have a lot of information. Here are the interview summaries
        for each of your personas: ${JSON.stringify(this.personas.map(p => p.interviewSummary))}`
      ),
      new HumanChatMessage(
        "Summarize your conversations, highlighting the customers, use-cases, and features that have the most commercial viability."
      ),
    ]);
    this.doc.interviewSummary = summary.text;
    await this.db.put(this.doc);
    const followUps = await this.bigInterviewer().call([
      new HumanChatMessage(
        `Based on this summary ${summary.text}, what are the top 3 questions we should ask the next customer we interview, 
        in an effort to discover the most compelling ways customers like ${this.doc.customer} could use ${this.doc.product}?`
      ),
    ]);
    this.doc.followUps = followUps.text;
    await this.db.put(this.doc);
  }
}


