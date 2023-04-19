import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Discovery, Persona } from "./gpt";

import { TextBox } from "./App";

export function PersonaLink({ persona }: any) {
  return (
    <div className="w-full md:w-1/3 mb-8 md:pr-4" key={persona.id}>
      <h2 className="text-lg font-bold  mb-4">{persona.displayName()}</h2>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <p className=" mb-2">{persona.displayAbout()}</p>
        <div className="underline text-right">
          {persona.hasInterviewed() ? (
            <Link to={`/persona/${persona.id}`}>View conversation</Link>
          ) : (
            <Link to={`/persona/${persona.id}`}>Conduct interview</Link>
          )}
        </div>
      </div>
    </div>
  );
}
const discovery = new Discovery();

export function PersonaPage() {
  const { id } = useParams();
  const [persona, setPersona] = useState<Persona | null>(null);

  async function rehydrateDiscovery() {
    await discovery.rehydrate();
    // discovery.registerChangeHandler(onChange)
  }

  useEffect(() => {
    rehydrateDiscovery();
  }, []);

  async function updatePersona() {
    // console.log('update persona', id)
    const persona = await discovery.personaById(id)
    setPersona(persona);
  }

  useEffect(() => {
    updatePersona()
  }, [id]);


  // console.log('persona', persona, id)
  return persona ? <PersonaInterview persona={persona} /> : <></>;
}

function PersonaInterview({ persona }: any) {
  const [perspective, setPerspective] = useState("");
  const [count, setCount] = useState(0);
  const [interviewing, setInterviewing] = useState(false);

  useEffect(() => {
    discovery.listener.on("*", async () => {
      await discovery.rehydrate();
    });
  }, []);

  const onChange = useCallback(() => {
    // console.log("onchange", count);
    setCount(count + 1);
  }, [count, persona, perspective, interviewing]);

  useEffect(() => {
    setPerspective(persona.perspective);
  }, [persona]);

  useEffect(() => {
    if (discovery.hydro) discovery.registerChangeHandler(onChange);
  }, [onChange]);

  async function doInterview(e:any) {
    e.preventDefault();
    persona.perspective = perspective;
    setInterviewing(true);
    await persona.doInterview();
    await persona.summarizeInterview();
    setInterviewing(false);
  }

  async function doSummary(e:any) {
    e.preventDefault();
    setInterviewing(true);
    await persona.summarizeInterview();
    setInterviewing(false);
  }
  return (
    <>
      <Link className="m-8 w-full block" to="/">
        ↩ Back to persona list
      </Link>
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
                {!interviewing ? (
                  <>
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      type="submit"
                      id="generate"
                      onClick={doInterview}
                    >
                      {persona.conversations.length ? "Redo" : "Conduct"}{" "}
                      Interview
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
                  </>
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
          {persona.followUpsAnswer ? (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg mt-6 p-4">
              <h3 className="text-xl font-bold">Follow-up Answer</h3>
              <p className="mt-2">{persona.followUpsAnswer}</p>
            </div>
          ) : (
            <></>
          )}
        </div>
        <div className="w-1/2 px-12">
          <h2 className="text-lg font-bold mb-4">
            {interviewing
              ? "Interview will take a few minutes"
              : persona.hasInterviewed()
              ? "Interview complete"
              : "Click 'Conduct Interview' to begin"}
          </h2>

          {persona.conversations.map((c:{}[], i:Number) => (
            <PersonaConversation persona={persona} conversation={c} key={i} />
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
      <p key={first.text + "ok"} className="italic font-bold">
        {first.text}
      </p>
      {rest.map((said:{text:string, by:string}) => (
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
