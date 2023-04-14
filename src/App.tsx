import React, { useState } from "react";
import { MoonIcon } from "./icons/Moon";
import logo from "./logo.svg";
import { Discovery } from "./gpt";

const discovery = new Discovery();

function App() {
  const [count, setCount] = useState(0);
  const [product, setProduct] = useState("");
  const [customer, setCustomer] = useState("");

  function toggleDarkMode() {
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
    } else {
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
    }
  }

  const toggle = (
    <button
      className="flex p-2 text-black rounded hover:text-yellow-400 dark:text-white focus:outline-none hover:bg-gray-500 dark:hover:bg-gray-500 dark:hover:text-yellow-400"
      onClick={toggleDarkMode}
    >
      <MoonIcon></MoonIcon>
    </button>
  );

  async function doGeneratePersonas(e) {
    e.preventDefault();
    // console.log("doGenerate", customer, product);
    await discovery.generateCustomers(product, customer);
    setCount(count + 1);
  }

  const didInterview = discovery.personas.find((p) => p.didAsk);

  console.log("render", didInterview, discovery);

  return (
    <div className="bg-gray-100 min-h-screen dark:bg-gray-900">
      <header className="bg-white py-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-center text-gray-800">
            Auto Epiphany
          </h1>
        </div>
      </header>
      <main className="container mx-auto py-8">
        <div className="w-full p-4 mb-4">
          <form>
            <div className="mb-4">
              <label
                className="block text-gray-700 font-bold mb-2"
                htmlFor="product"
              >
                {" "}
                Product
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="product"
                name="product"
                onChange={({ target }) => setProduct(target.value)}
                value={product}
                placeholder="Enter product here..."
              ></textarea>
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 font-bold mb-2"
                htmlFor="customer"
              >
                {" "}
                Customer
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="customer"
                name="customer"
                onChange={({ target }) => setCustomer(target.value)}
                value={customer}
                placeholder="Enter customer here..."
              ></textarea>
            </div>
            <div className="flex items-center justify-center">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
                id="generate"
                onClick={doGeneratePersonas}
              >
                Generate Customers
              </button>
            </div>
          </form>
        </div>
        <div className="w-full flex flex-wrap">
          {discovery.personas.map((p) => (
            <PersonaInterview persona={p}></PersonaInterview>
          ))}
        </div>
      </main>
      <FollowUp discovery={discovery} />
    </div>
  );
}

function FollowUp({ discovery }: any) {
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(0);

  async function doGenerateSummary(e) {
    e.preventDefault()
    await discovery.generateInterviewSummary();
    setCount(count + 1);
  }

  return (
    <div className="w-full p-4 mb-4">
      <form>
        <div className="mb-4">
          <label
            className="block text-gray-700 font-bold mb-2"
            htmlFor="product"
          >
            Additional notes based on the interviews
          </label>
          <textarea
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="notes"
            name="notes"
            onChange={({ target }) => setNotes(target.value)}
            value={notes}
            placeholder="Enter additional notes..."
          ></textarea>
        </div>
        <div className="flex items-center justify-center">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
            id="generate"
            onClick={doGenerateSummary}
          >
            Generate Summary
          </button>
        </div>
      </form>
      {discovery.interviewSummary && <p className="text=-black">{discovery.interviewSummary}</p>}
    </div>
  );
}

function PersonaInterview({ persona }: any) {
  const [perspective, setPerspective] = useState("");
  const [count, setCount] = useState(0);

  async function doInterview(e) {
    e.preventDefault();
    // console.log("do inteview", persona);
    persona.perspective = perspective;
    await persona.conductInterview(
      "What are the biggest problems a product like this could help you solve?"
    );
    await persona.conductInterview("How much does this problem cost you?");
    await persona.conductInterview("What other solutions are you considering?");
    await persona.conductInterview(
      "If you could wave a magic wand and change anything about this, what would you do?"
    );
    // console.log(persona.conversation);
    setCount(count + 1);
  }

  return (
    <div className="w-full md:w-1/3 mb-8 md:pr-4" key={persona.description}>
      <h2 className="text-lg font-bold text-gray-800 mb-4">Column 1</h2>
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
            <PersonaConversation persona={persona} conversation={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonaConversation({ persona, conversation }: any) {
  // console.log(persona, conversation);
  const [first, ...rest] = conversation;
  return (
    <div className="flex flex-col items-start bg-gray-100 rounded-lg p-2 my-2">
      <p className="text-gray-700 italic font-bold">{first.text}</p>
      {rest.map((said) => (
        <p
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

export default App;
