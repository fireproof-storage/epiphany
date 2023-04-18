import React, { ReactNode, useEffect, useState } from "react";
import {
  Route,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";

// import { Fireproof, Index } from '@fireproof/core'
// import { useFireproof, FireproofCtx, FireproofCtxValue } from '@fireproof/core/hooks/use-fireproof'

import { Discovery } from "./gpt";
import { PersonaLink, PersonaPage } from "./Persona";

const discovery = new Discovery();
export interface LayoutProps {
  children?: ReactNode;
}
function Layout({ children }: LayoutProps): JSX.Element {
  return (
    <div className="bg-gray-200 min-h-screen dark:bg-gray-900 dark:text-gray-100">
      <header className="bg-gray-100 py-4 dark:bg-gray-800">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-center">
            <a href="/">Auto Steps to the Epiphany</a>
          </h1>
        </div>
      </header>
      {children ? <>{children}</> : <Outlet />}
    </div>
  );
}

function App() {
  function defineRouter(): React.ReactNode {
    return (
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="persona">
          <Route path=":id" element={<PersonaPage />}></Route>
        </Route>
      </Route>
    );
  }
  return (
    <RouterProvider
      router={createBrowserRouter(createRoutesFromElements(defineRouter()))}
      fallbackElement={<Home />}
    />
  );
}

function Home() {
  const [count, setCount] = useState(0);
  const [product, setProduct] = useState("");
  const [customer, setCustomer] = useState("");
  const [openAIKey, setOpenAIKey] = useState("");

  async function onChange() {
    // console.log("onchange");
    setCount(count + 1);
  }

  async function connectDiscovery() {
    if (discovery.hydro) return;
    console.log("connectDiscovery");
    await discovery.rehydrate();
    discovery.registerChangeHandler(onChange);
    if (discovery.doc?.product) setProduct(discovery.doc.product);
    if (discovery.doc?.customer) setCustomer(discovery.doc.customer);
    if (discovery.doc?.openAIKey) setOpenAIKey(discovery.doc.openAIKey);
  }

  useEffect(() => {
    connectDiscovery();
  }, []);

  async function doGeneratePersonas(e) {
    e.preventDefault();
    await discovery.generateCustomers(product, customer, openAIKey);
  }

  return (
    <main className="container mx-auto py-8">
      <div className="w-full flex flex-wrap">
        <div className="w-1/2 p-4 mb-4">
          <p className="pb-2">
            This app is inspired by the classic customer development methodology
            outlined in Steven Blank's <a href="">Four Steps to the Epiphany</a>
            , which offers practical patterns for finding product market fit.
            The book is a must read for anyone bringing a new product to market.
          </p>
          <h3 className="text-xl font-bold my-2">Persona Development</h3>
          <p className="py-2">
            First describe your product and your initial customer hypothesis.
            Then ChatGPT will synthesize a handful of customer personas for you.
            For each persona, click in and have a guided GPT interview with them
            about how your product can fit their needs. After all the interviews
            are complete, GPT provides an set of criteria your personas might
            evaluate your product using.
          </p>
          <p className="pb-2">
            Provide your Open AI API key to get started. No data is sent to the
            app, only to OpenAI's APIs. Your work is stored locally in the
            browser using Fireproof.{" "}
            <a href="">Read more about using Fireproof with AI</a>, and{" "}
            <a href="">how to get started with React.</a>
          </p>
        </div>
        <div className="w-1/2 p-4 mb-4">
          <form>
            <div className="mb-4">
              <label
                className="block text-gray-700 font-bold mb-2 dark:text-gray-300"
                htmlFor="openaikey"
              >
                Your OpenAI API key (
                <a href="https://platform.openai.com/account/api-keys">
                  get one here
                </a>
                ):
              </label>
              <input
        className="shadow border-none appearance-none rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-black leading-tight focus:outline-none focus:shadow-outline"
        type="text"
                id="openaikey"
                name="openaikey"
                placeholder="sk-..."
                value={openAIKey}
                onChange={(e) => {
                  setOpenAIKey(e.target.value);
                }}
              />
              <p className="italic p-2">
                If you work for OpenAI, think about implementing{" "}
                <a href="https://ucan.xyz/">UCAN</a> for distributed auth.
              </p>
            </div>

            <TextBox
              label="Product elevator pitch"
              id="product"
              value={product}
              valueChanged={setProduct}
            />
            <TextBox
              label="Target customer"
              id="customer"
              value={customer}
              valueChanged={setCustomer}
            />
            <div className="flex items-center justify-center">
              {openAIKey ? (<button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
                id="generate"
                onClick={doGeneratePersonas}
              >
                Generate {discovery.personas.length ? 'Additional' : ''} Personas
              </button>) : (<button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
                id="generate"
                disabled
              >
                Please enter API key to begin
              </button>)}
            </div>
          </form>
        </div>
      </div>
      {discovery.personas.length ? (
        <h3 className="text-xl font-bold text-center m-12">
          Generated Personas
        </h3>
      ) : (
        <></>
      )}
      <div className="w-full flex flex-wrap">
        {discovery.personas
          .filter((p) => p.description)
          .map((p) => (
            <PersonaLink persona={p} />
          ))}
      </div>
    </main>
  );
}

export function TextBox({ label, id, value, valueChanged }: any) {
  return (
    <div className="mb-4">
      <label
        className="block text-gray-700 font-bold mb-2 dark:text-gray-300"
        htmlFor={id}
      >
        {label}
      </label>
      <textarea
        className="shadow border-none h-32 appearance-none rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-black leading-tight focus:outline-none focus:shadow-outline"
        id={id}
        name={id}
        onChange={({ target }) => valueChanged(target.value)}
        value={value}
        placeholder={label}
      ></textarea>
    </div>
  );
}

function FollowUp({ discovery }: any) {
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(0);

  async function doGenerateSummary(e) {
    e.preventDefault();
    await discovery.generateInterviewSummary();
    setCount(count + 1);
  }

  return (
    <div className="w-full p-4 mb-4">
      <form>
        <TextBox
          label="Additional notes based on the interviews"
          id="product"
          value={notes}
          valueChanged={setNotes}
        />
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
      {discovery.doc.interviewSummary && (
        <p className="text=-black">{discovery.doc.interviewSummary}</p>
      )}
      {discovery.doc?.followUps && <AskFollowUps discovery={discovery} />}
    </div>
  );
}

function AskFollowUps({ discovery }) {
  const [count, setCount] = useState(0);

  async function doFollowUp() {
    await discovery.askFollowUps();
    setCount(count + 1);
  }

  return (
    <>
      <h3>Follow up questions</h3>
      <p className="text=-black">{discovery.doc?.followUps}</p>
      <button onClick={doFollowUp}>Ask them</button>
    </>
  );
}

export default App;
