import React, { ReactNode, useCallback, useEffect, useState } from "react";
import {
  Link,
  Route,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";

import { Discovery } from "./gpt";
import { PersonaLink, PersonaPage } from "./Persona";

const discovery = new Discovery();
export interface LayoutProps {
  children?: ReactNode;
}
function Layout({ children }: LayoutProps): JSX.Element {
  return (
    <div className="bg-gray-200 text-gray-900 min-h-screen dark:bg-gray-900 dark:text-gray-100">
      <header className="py-4 bg-gray-800 text-gray-100">
        <a href="https://fireproof.storage/" style={{ position: "absolute" }}>
          <img
            src="https://fireproof.storage/static/img/logo-animated.svg"
            alt="Fireproof Logo"
            style={{ height: "45px", width: "auto", paddingLeft: "0.5em" }}
          />
        </a>
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-center">
            <Link to="/">Auto Steps to the Epiphany</Link>
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
  const [generating, setGenerating] = useState(false);

  const onChange = useCallback(() => {
    // console.log("onchange", count);
    setCount(count + 1);
  }, [count, product, customer, openAIKey, generating]);

  async function connectDiscovery() {
    if (discovery.hydro) return;
    // console.log("connectDiscovery");
    await discovery.rehydrate("home");
    discovery.registerChangeHandler(onChange);
    if (discovery.doc?.product) setProduct(discovery.doc.product);
    if (discovery.doc?.customer) setCustomer(discovery.doc.customer);
    if (discovery.doc?.openAIKey) setOpenAIKey(discovery.doc.openAIKey);
    setCount(count + 1);
  }

  useEffect(() => {
    connectDiscovery();
  }, []);

  async function doGeneratePersonas(e: any) {
    e.preventDefault();
    setGenerating(true);
    await discovery.generateCustomers(product, customer, openAIKey);
    setGenerating(false);
  }

  // console.log("render", discovery.personas.length, count);
  async function doResetPersonas(e: any) {
    e.preventDefault();
    await discovery.resetPersonas();
  }

  return (
    <main className="container mx-auto py-8">
      <div className="w-full flex flex-wrap">
        <div className="w-1/2 p-4 mb-4">
          <p className="pb-2">
            This app is inspired by the classic customer development methodology
            outlined in Steve Blank's{" "}
            <a href="https://www.google.com/search?q=four+steps+to+the+epiphany">
              The Four Steps to the Epiphany - Successful Strategies for
              Products that Win
            </a>
            , which offers practical patterns for finding product market fit.
            The book is a must read for anyone bringing a new product to market.
          </p>
          <p className="pb-2">
            This app uses the auto-GPT method. It creates a set of personas and
            simulates product interviews with them. It then summarizes each
            interview and provides an overall summary.{" "}
            <strong>This is no substitute for real customer interviews.</strong>
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
            browser using Fireproof. Read more about{" "}
            <a href="https://fireproof.storage/documentation/usefireproof-hook-for-react/">
              how to get started using Fireproof with React
            </a>{" "}
            and scale for free.
          </p>
          <p className="py-2">
            Report bugs and{" "}
            <a href="https://github.com/fireproof-storage/epiphany">
              fork me on GitHub
            </a>
            .
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
              {generating ? (
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="submit"
                  id="generate"
                  disabled
                >
                  Generating...
                </button>
              ) : openAIKey ? (
                discovery.personas.length ? (
                  <>
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      type="submit"
                      id="generate"
                      onClick={doGeneratePersonas}
                    >
                      Generate Additional Personas
                    </button>
                    <button
                      className="bg-orange-500 hover:bg-orange-700 ml-2 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      type="submit"
                      id="reset"
                      onClick={doResetPersonas}
                    >
                      Reset Personas
                    </button>
                  </>
                ) : (
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="submit"
                    id="generate"
                    onClick={doGeneratePersonas}
                  >
                    Generate Personas
                  </button>
                )
              ) : (
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="submit"
                  id="generate"
                  disabled
                >
                  Please enter API key to begin
                </button>
              )}
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
            <PersonaLink persona={p} key={p.id} />
          ))}
      </div>
      <div>
        {discovery.personas.find((p) => p.hasInterviewed()) ? (
          <>
            <FollowUp discovery={discovery} />
          </>
        ) : (
          <></>
        )}
      </div>
    </main>
  );
}

export function TextBox({ label, id, value, valueChanged }: any) {
  return (
    <div className="mb-4">
      <h3 className="text-xl font-bold text-center m-12">
        Summary and follow-up
      </h3>
      <p className="pb-2">
        In the next phase, we'll summarize your interviews and come up with a
        few additional questions to ask. You can add notes to customize the
        summary, and then ask the additional questions.
      </p>
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

  async function doGenerateSummary(e: any) {
    e.preventDefault();
    await discovery.generateInterviewSummary();
    setCount(count + 1);
  }

  return (
    <div className="w-full p-4 mb-4">
      <form>
        <TextBox
          label="Optional notes to include in the summary"
          id="product"
          value={notes}
          valueChanged={setNotes}
        />
        <div className="flex items-center justify-center">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-6 rounded focus:outline-none focus:shadow-outline"
            type="submit"
            id="generate"
            onClick={doGenerateSummary}
          >
            Generate Summary
          </button>
        </div>
      </form>
      {discovery.doc.interviewSummary && (
        <div className="p-4 my-6 bg-gray-100 dark:bg-gray-700 rounded">
          <h3 className="text-xl font-bold">Summary</h3>
          <p>{discovery.doc.interviewSummary}</p>
        </div>
      )}
      {discovery.doc?.followUps && <AskFollowUps discovery={discovery} />}
    </div>
  );
}

function AskFollowUps({ discovery }: any) {
  const [asking, setAsking] = useState(false);

  async function doFollowUp() {
    setAsking(true);
    await discovery.askFollowUps();
    setAsking(false);
  }

  return (
    <div className="p-4 my-6 bg-gray-100 dark:bg-gray-800 rounded">
      <h3 className="text-xl font-bold">Follow up questions</h3>
      <p className="text=-black">{discovery.doc?.followUps}</p>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-6 rounded focus:outline-none focus:shadow-outline"
        type="submit"
        id="generate"
        onClick={doFollowUp}
        disabled={asking}
      >
        {asking ? "Asking..." : "Ask follow-ups"}
      </button>
      <p>Answers will appear on the interview pages.</p>
    </div>
  );
}

export default App;
