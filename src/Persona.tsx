import React, { useEffect, useState } from "react";

export function PersonaLink({ persona }: any) {
  return (
    <div className="w-full md:w-1/3 mb-8 md:pr-4" key={persona.description}>
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        {persona.displayName()}
      </h2>
      <div className="bg-white rounded-lg shadow-lg p-4">
        <p className="text-gray-700 mb-2">{persona.description}</p>
        <div className="space-end">
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

export function PersonaPage(props) {
  console.log('props', props)
  return <></>
}

function PersonaInterview({ persona }: any) {
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

  return (
    <div className="w-full md:w-1/3 mb-8 md:pr-4" key={persona.description}>
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        {persona.displayName()}
      </h2>
      <div className="bg-white rounded-lg shadow-lg p-4">
        <p className="text-gray-700 mb-2">{persona.description}</p>

        <form>
          {" "}
          <textarea
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            onChange={({ target }) => setPerspective(target.value)}
            value={perspective}
            placeholder="Add optional perspective..."
          ></textarea>
          <div className="flex items-center justify-center">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
              id="generate"
              onClick={doInterview}
            >
              Conduct Interview
            </button>
          </div>
        </form>

        <div className="flex flex-col">
          {persona.conversations.map((c) => (
            <PersonaConversation
              persona={persona}
              conversation={c}
              key={c.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonaConversation({ persona, conversation }: any) {
  // console.log(persona, conversation);
  if (conversation.length === 0) return <></>;
  const [first, ...rest] = conversation;
  return (
    <div
      className="flex flex-col items-start bg-gray-100 rounded-lg p-2 my-2"
      key={persona.description}
    >
      <p key={first.text} className="text-gray-700 italic font-bold">
        {first.text}
      </p>
      {rest.map((said) => (
        <p
          key={said.text}
          className={`mt-4 ${
            said.by === "persona" ? "pl-4" : "italic text-gray-700"
          }`}
        >
          {said.text}
        </p>
      ))}
    </div>
  );
}
