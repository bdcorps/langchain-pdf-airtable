# Programmatic SEO with Langchain and Launchman

This repo lets you ask 10-Q PDFs ask questions > Save the answers as markdown in an Airtable base. The resulting Airtable can then be synced with launchman.com to create Programmatic SEO pages. 

More details: https://twitter.com/thisissukh_/status/1645183376222195712

## How to use

1. Add a .env file:

```
OPENAI_API_KEY=
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
```

2. Run `npm i`
3. Run `nm run dev`

You will see a response in your console for the Microsoft 10-K report

## Acknowldgements

- Big thanks to https://github.com/mayooear/gpt4-pdf-chatbot-langchain for the PDF loader functions
# langchain-pdf-airtable
