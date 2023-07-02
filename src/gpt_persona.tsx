import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  BaseChatMessage,
  HumanChatMessage,
  SystemChatMessage,
} from "langchain/schema";
import { TEMPERATURE } from "./gpt";

interface PersonaDoc {
  openAIKey: string;
  description: string;
  product: string;
  customer: string;
  conversations: null |  Array<{ by: string; text: string }>[];
  perspective: string;
  followUpsAnswer: string;
  interviewSummary: string;
  didInterview: boolean;
  _id?: string;
  [key: string]: any;
}

export class Persona implements PersonaDoc {
  static docFields =
    "openAIKey description product customer conversations perspective followUpsAnswer interviewSummary didInterview";

  didAsk: boolean;
  // conversations: { by: string; text: string }[][];
  id: null | string;
  db: any;
  chat: any;
  interviewer: any;
  
  openAIKey: string;
  description: string;
  product: string;
  customer: string;
  conversations: null |  Array<{ by: string; text: string }>[];
  perspective = ""
  followUpsAnswer = ""
  interviewSummary = ""
  didInterview = false;
  _id?: string;
  [key: string]: any;

  constructor(
    description: string,
    {
      product,
      customer,
      openAIKey,
      _id,
    }: PersonaDoc,
    db: any
  ) {
    this.openAIKey = openAIKey;
    this.description = description;
    this.didAsk = false;
    this.conversations = [];
    this.product = product;
    this.customer = customer;
    this.id = null;
    this.db = db;
  }

  myChat(): any {
    if (this.chat) return this.chat;
    const api = new ChatOpenAI({
      temperature: TEMPERATURE,
      openAIApiKey: this.openAIKey,
    });
    this.chat = {
      call: async (msgs: BaseChatMessage[]) => {
        const res = api.call(msgs);
        return res;
      },
    };
    return this.chat;
  }

  myInterviewer() {
    if (this.interviewer) return this.interviewer;
    const api = new ChatOpenAI({
      temperature: TEMPERATURE,
      openAIApiKey: this.openAIKey,
    });
    this.interviewer = {
      call: async (msgs: BaseChatMessage[]) => {
        const res = api.call(msgs);
        return res;
      },
    };
    return this.interviewer;
  }

  displayName() {
    const match = this.description?.match(/(.*?)[:]/);
    // console.log('match', match, this.description)
    return match && match[1];
  }

  displayAbout() {
    // console.log(this.description)
    const match = this.description?.match(/[:](.*)/);  
    return match && match[1];
  }

  hasInterviewed() {
    return this.conversations
      ? this.conversations.length > 0
      : this.didInterview;
  }

  static fromDoc(doc: PersonaDoc, db: any) {
    const persona = new Persona("", doc, db);
    Persona.docFields
      .split(" ")
      .forEach((field: keyof PersonaDoc) => (persona[field] = doc[field]));
    persona.id = doc._id || null;
    return persona;
  }

  async persist() {
    const doc: PersonaDoc = {
      type: "persona",
      openAIKey: this.openAIKey,
      description: this.description,
      product: this.product,
      customer: this.customer,
      conversations: this.conversations,
      perspective: this.perspective,
      followUpsAnswer: this.followUpsAnswer,
      interviewSummary: this.interviewSummary,
      didInterview: this.didInterview,
    };

    if (this.id) {
      doc._id = this.id;
    }

    // Persona.docFields.split(" ").forEach((field: keyof Persona) => {
    //   if (this[field]) {
    //     doc[field] = this[field];
    //   }
    // });
    console.log("persisting", doc);
    const resp = await this.db.put(doc);
    this.id = resp.id;
  }

  async askFollowUps(followups: string) {
    const qAnswer = await this.myChat().call([new HumanChatMessage(followups)]);
    this.followUpsAnswer = qAnswer.text;
    await this.persist();
  }

  async doInterview() {
    this.conversations = []; // reset
    await this.pursueQuestions(
      "What are the biggest problems a product like this could help you solve?"
    );
    await this.pursueQuestions(
      "How much do these problem cost you in money and time?"
    );
    await this.pursueQuestions("What other solutions are you considering?");
    await this.pursueQuestions(
      "If you could wave a magic wand and change anything about this, what would you do?"
    );
  }

  async pursueQuestions(
    question: string,
    thisConvo: { by: string; text: string }[] | null = null,
    rounds = 3
  ): Promise<undefined> {
    if (rounds < 1) return;
    if (thisConvo === null) {
      thisConvo = [];
      this.conversations?.push(thisConvo);
    }
    const messages = [];
    if (!this.didAsk) {
      messages.push(
        new SystemChatMessage(
          `You will act in a dialog as ${
            this.description
          }. We will interview you about ${this.product} 
          designed for someone like ${this.customer}. You have a perspective ${
            this.perspective
          }.
          It is crucial that you stay in character as ${this.displayName()}, so don't say you are an AI model,
          pretend to play along in the dialog. When the interviewer addesses "you" remember that they are talking
          to ${this.displayName()} and answer convincingly.`
        )
      );
      this.didAsk = true;
    }
    messages.push(
      new SystemChatMessage(`Here is the next question from the human. 
    Remember to stay in character as ${this.displayName()}. You don't need to say 
    "As an AI language model, I do not have ..." because the tool is well-labelled with AI disclaimers.
    Just answer the question as if you were ${this.displayName()}. Remember that when the interviewer 
    says "you" they are talking to ${this.displayName()}.`)
    );
    messages.push(new HumanChatMessage(question));

    thisConvo.push({ by: "interviewer", text: question });
    await this.persist();

    const qAnswer = await this.myChat().call(messages);

    thisConvo.push({ by: "persona", text: qAnswer.text });
    await this.persist();

    const furtherQuestions = await this.myInterviewer().call([
      new SystemChatMessage(
        `Here is the response from ${this.description} to the question: ${question}. What should we ask them next?`
      ),
      new HumanChatMessage(qAnswer.text),
    ]);
    return this.pursueQuestions(furtherQuestions.text, thisConvo, rounds - 1);
  }

  async summarizeInterview() {
    // console.log(JSON.stringify(this.conversations));
    const qAnswer = await this.myChat().call([
      new SystemChatMessage(
        `Summarize the interview for another instance of ChatGPT, target summary length is 1000 words.
        Here is the interview text as a reminder: ${JSON.stringify(
          this.conversations
        ).substring(0, 2000)}`
      ),
    ]);
    console.log("summary", qAnswer);
    this.interviewSummary = qAnswer.text;
    await this.persist();
  }
}
