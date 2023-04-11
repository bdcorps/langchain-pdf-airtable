import * as dotenv from "dotenv";

dotenv.config();

import Airtable from "airtable";
import * as fs from "fs";
import { VectorDBQAChain } from "langchain/chains";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { OpenAI } from "langchain/llms";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HNSWLib } from "langchain/vectorstores";
import { CustomPDFLoader } from "../utils/CustomPDFLoader";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID as string);

export const main = async () => {
  try {
    const model = new OpenAI({ maxTokens: 1000, temperature: 0.1 });
    const files = fs.readdirSync("./reports");

    for (const reportFileName of files) {
      console.log("Reading: " + reportFileName)

      const [companyName, reportType, reportYear] = reportFileName.split("_")

      const loader = new CustomPDFLoader("./reports/" + reportFileName);
      const doc = await loader.load();

      const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });

      const docs = await textSplitter.splitDocuments(doc);

      const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
      const qaChain = VectorDBQAChain.fromLLM(model, vectorStore);

      const questions = [
        "Analyze the financial statements of the company: balance sheet, income statement, and statement of cash flows.",
        "Examine the revenue and earnings trends, and comment on the company's growth and sales performance during the reporting period.",
        "Evaluate the company's gross and operating margins, and discuss its cost structure, pricing power, and operational efficiency.",
        "Identify the Key Performance Indicators (KPIs) relevant to the company's industry, and assess the company's performance against these KPIs.",
        "Summarize the main points from the Management's Discussion and Analysis (MD&A) section, including management's perspective on the company's performance and future outlook.",
        "Analyze the performance of the company's different business segments, and identify which segments are driving growth or facing challenges.",
        "List the disclosed risk factors, and evaluate how these risks could potentially impact the company's performance.",
        "Provide an overview of any ongoing legal proceedings, and assess their potential impact on the company's financial health.",
        "Discuss any significant details from the footnotes, including accounting policies and notable events or transactions during the reporting period.",
        "Describe any subsequent events disclosed in the 10-Q report, and analyze their potential impact on the company's financial condition and future prospects."
      ]

      const answers = (await Promise.all(questions.map(async (question) => {
        const answer = await qaChain.call({
          input_documents: docs,
          query: `You are a financial analyst for ${companyName}. This is the ${reportType} for ${companyName} for ${reportYear}` + question + ". Give a detailed and long answer backed with data. Do not point to a section in the report. Be succinct.",
        });

        console.log(answer)
        return "\n\n ## " + question + "\n" + answer.text;

      })))

      await writeToAirtableBase(companyName, reportType, reportYear, answers.join("\n"))
    }
  } catch (e) {
    console.log(e)
  }
};


const writeToAirtableBase = async (companyName: string, reportType: string, reportYear: string, answers: string) => {
  const table = base('Langchain Stocks');

  table.create({ companyName, reportType, reportYear, answers }).then(() => {
    console.log('New records added successfully!');
  }).catch((error) => {
    console.error('Error adding new records:', error);
  });

}

main();
