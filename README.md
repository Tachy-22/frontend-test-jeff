

---

```markdown
# 📄 Document Signer & Annotation Tool

An interactive web application built with **Next.js**, **TypeScript**, and **Tailwind CSS** that allows users to upload, annotate, and sign PDF documents in a seamless single-page interface.

## 🚀 Features

- ✅ Upload PDF documents (via drag-and-drop or file selector)
- 🎨 Highlight text with customizable colors
- ✍️ Underline text with customizable colors
- 💬 Add comments attached to specific areas
- 🖋️ Draw signatures anywhere on the document
- 🖼️ Render PDFs in-browser using canvas
- 📦 Export annotated PDFs

---

## 🛠️ Tech Stack

| Tech            | Description                              |
|-----------------|------------------------------------------|
| [Next.js](https://nextjs.org)      | React-based framework for server-side rendering |
| [TypeScript](https://www.typescriptlang.org/) | Typed superset of JavaScript |
| [Tailwind CSS](https://tailwindcss.com) | Utility-first CSS framework |
| [react-pdf](https://github.com/wojtekmaj/react-pdf) | PDF viewer component for React |
| [pdf-lib](https://github.com/Hopding/pdf-lib) | PDF manipulation in the browser |
| [react-dropzone](https://react-dropzone.js.org/) | Drag-and-drop file uploader |
| [react-signature-canvas](https://github.com/agilgur5/react-signature-canvas) | Signature drawing canvas |
| [zustand](https://github.com/pmndrs/zustand) | Simple and lightweight state management |

---

## 📁 Project Structure

```
/document-signer-tool
├── public/
├── components/
│   ├── PdfViewer.tsx
│   ├── AnnotationTools.tsx
│   ├── SignatureCanvas.tsx
├── pages/
│   ├── index.tsx
├── styles/
│   └── globals.css
├── utils/
│   └── pdfHelpers.ts
├── types/
│   └── index.d.ts
├── store/
│   └── useAnnotationStore.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
```

---

## 📸 Screenshots

Coming soon...

---

## ⚙️ Setup Instructions

1. **Clone the Repository**

```bash
git clone https://github.com/your-username/document-signer-tool.git
cd document-signer-tool
```

2. **Install Dependencies**

```bash
npm install
# or
yarn install
```

3. **Run the Development Server**

```bash
npm run dev
# or
yarn dev
```

4. **Open in Browser**

Visit [http://localhost:3000](http://localhost:3000)

---

## 📌 TODO

- Export annotated PDF
- Add undo/redo functionality
- Add zoom and pan
- Support mobile responsiveness
- Comment list view sidebar

---

## 🧪 Testing

Basic testing can be added using **Jest** and **React Testing Library**.

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙌 Contributions

Pull requests and feature suggestions are welcome! Please open an issue or submit a PR.

```

Let me know if you'd like this tailored to a specific folder structure or deployment instructions (e.g. Vercel, Docker).