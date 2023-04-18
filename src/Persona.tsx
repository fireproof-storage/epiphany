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

export function PersonaPage() {
  const { id } = useParams();
  const [persona, setPersona] = useState(null);
  const [count, setCount] = useState(0);
  
  async function onChange() {
    console.log('onchange')
    setCount(count + 1);
  }

  async function rehydrateDiscovery() {
    await discovery.rehydrate();
    discovery.registerChangeHandler(onChange)
    setPersona(discovery.personaById(id));
  }

  useEffect(() => {
    rehydrateDiscovery();
  }, []);

  return <PersonaInterview persona={persona} />;
}

function PersonaInterview({ persona }: any) {
  if (!persona) return <></>;
  const [perspective, setPerspective] = useState(persona.perspective);
  const [count, setCount] = useState(0);


  async function doInterview(e) {
    e.preventDefault();
    // console.log("do inteview", persona);
    persona.perspective = perspective;
    await persona.doInterview()
  }

  async function doSummary(e) {
    e.preventDefault();
    await persona.summarizeInterview();
    setCount(count + 1);
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
                ) : (
                  <></>
                )}
              </div>
            </form>
          </div>
          {persona.interviewSummary ? (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg mt-6 p-4">
              <h3 className="text-xl font-bold">Summary</h3>
              <p className="mt-2">{persona.interviewSummary}</p>
            </div>
          ) : (
            <></>
          )}
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
      key={first.text}
    >
      <p key={first.text+"ok"} className="italic font-bold">
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
