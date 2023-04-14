// import { ChatOpenAI } from "langchain/chat_models/openai";
// import { HumanChatMessage, SystemChatMessage } from "langchain/schema";

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
  personas = [];
  constructor() {
    this.interviewer = new ChatOpenAI({ temperature: 0 });
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
    this.personas = gptPeople.text
      .split("\n")
      .map((p) => new Persona(p, this.interviewer, product, customer));
  }

  async generateInterviewSummary() {
    const summary = await this.interviewer.call([
      new SystemChatMessage(
        'Now that you have interviewed your customers, you have a lot of information. You need to summarize it.',
      ),
      // new HumanChatMessage(
      //   'What are the top 3 questions we should ask the next customer we interview?',
      // ),
      new HumanChatMessage(
        'Summarize your conversations, highlighting the customers, use-cases, and features that have the most commercial viability.',
      )
    ])
    this.interviewSummary = summary.text
  }
}

export class Persona {
  perspective = "";
  constructor(description, interviewer, product, customer) {
    this.interviewer = interviewer;
    this.chat = new ChatOpenAI({ temperature: 0 });
    this.description = description;
    this.didAsk = false;
    this.conversations = []
    this.product = product
    this.customer = customer
  }

  async conductInterview(question, thisConvo = null, rounds = 3) {
    if (rounds < 1) return;
    if (!thisConvo) {
      thisConvo = []
      this.conversations.push(thisConvo)
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

    thisConvo.push({by : 'interviewer', text: question})

    thisConvo.push({by : 'persona', text: qAnswer.text})

    const furtherQuestions = await this.interviewer.call([
      new SystemChatMessage(
        `Here is the response from ${this.description} to the question: ${question}. What should we ask them next?`
      ),
      new HumanChatMessage(qAnswer.text),
    ]);

    return this.conductInterview(furtherQuestions.text, thisConvo, rounds - 1);
  }
}
