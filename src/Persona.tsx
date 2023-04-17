import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Discovery } from "./gpt";

import { TextBox } from "./App";

export function PersonaLink({ persona }: any) {
  return (
    <div className="w-full md:w-1/3 mb-8 md:pr-4" key={persona.description}>
      <h2 className="text-lg font-bold  mb-4">{persona.displayName()}</h2>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <p className=" mb-2">{persona.displayAbout()}</p>
        <div className="underline text-right">
          {persona.conversations.length ? (
            <a href={`/persona/${persona.id}`}>View conversation</a>
          ) : (
            <a href={`/persona/${persona.id}`}>Conduct interview</a>
          )}
        </div>
      </div>
    </div>
  );
}
const discovery = new Discovery();

export function PersonaPage(props) {
  const { id } = useParams();
  const [persona, setPersona] = useState(null);
  console.log("props", id);

  async function rehydrateDiscovery() {
    await discovery.rehydrate();
    setPersona(discovery.personaById(id));
  }

  useEffect(() => {
    rehydrateDiscovery();
  }, []);

  return <PersonaInterview persona={persona} />;
}

function PersonaInterview({ persona }: any) {
  if (!persona) return <></>;
  const [perspective, setPerspective] = useState("");
  const [count, setCount] = useState(0);

  //   const product = await ux.prompt('What is the quick elevator pitch for your product.')
  //   const customer = await ux.prompt('Please describe your most clearly understood customer or initial user.')
  //   const channel = await ux.prompt('What is the primary channel through which you will reach your customer?')
  //   const pricing = await ux.prompt('What is the pricing model for your product?')
  //   const problem = await ux.prompt('What is the problem that your customer is trying to solve?')
  //   const dayInLife = await ux.prompt('What is a typical day in the life of your customer?')
  //   const buyerMapPeople = await ux.prompt('Who are the people that influence the buying decision?')
  //   const roiJustification = await ux.prompt('What is the ROI justification for your product?')
  //   const buyingHabits = await ux.prompt('What are the buying habits of your customer? What channels to the puchase through?')

  async function doInterview(e) {
    e.preventDefault();
    // console.log("do inteview", persona);
    persona.perspective = perspective;
    persona.conversations = [];
    await persona.conductInterview(
      "What are the biggest problems a product like this could help you solve?"
    );
    setCount(count + 1);
    await persona.conductInterview("How much does this problem cost you?");
    setCount(count + 1);
    await persona.conductInterview("What other solutions are you considering?");
    setCount(count + 1);
    await persona.conductInterview(
      "If you could wave a magic wand and change anything about this, what would you do?"
    );
    // console.log(persona.conversation);
    await persona.persist();
    setCount(count + 1);
  }
  async function doSummary() {

  }

  return (
    <>
      <a className="m-8 w-full block" href="/">
        ↩ Back to persona list
      </a>
      <div className="w-full flex p-8" key={persona.description}>
        <div className="w-1/2 px-12">
          <h2 className="text-lg font-bold mb-4">{persona.displayName()}</h2>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <p className=" mb-2">{persona.displayAbout()}</p>
            <form>
              <TextBox
                label="Add optional perspective..."
                id="perspective"
                value={perspective}
                valueChanged={setPerspective}
              />
              <div className="flex items-center justify-center">
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="submit"
                  id="generate"
                  onClick={doInterview}
                >
                  {persona.conversations.length ? "Redo" : "Conduct"} Interview
                </button>

                {persona.conversations.length ? (
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mx-4 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="submit"
                    id="summarize"
                    onClick={doSummary}
                  >
                    Summarize
                  </button>
                ) : <></>}
              </div>
            </form>
          </div>
        </div>
        <div className="w-1/2 px-12">
          {persona.conversations.map((c) => (
            <PersonaConversation
              persona={persona}
              conversation={c}
              key={c.description}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function PersonaConversation({ persona, conversation }: any) {
  // console.log(persona, conversation);
  if (conversation.length === 0) return <></>;
  const [first, ...rest] = conversation;
  return (
    <div
      className="flex flex-col items-start bg-gray-100 dark:bg-gray-800 rounded-lg p-6 my-2"
      key={persona.description}
    >
      <p key={first.text} className="italic font-bold">
        {first.text}
      </p>
      {rest.map((said) => (
        <p
          key={said.text}
          className={`mt-4 ${said.by === "persona" ? "pl-4" : "italic"}`}
        >
          {said.text}
        </p>
      ))}
    </div>
  );
}
