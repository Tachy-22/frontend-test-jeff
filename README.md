
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
| [react context](https://react.dev/reference/react/createContext) | Simple and lightweight state management |

---

## ⚙️ Challenges & Solutions
### 1. 📦 pdfjs-dist Compatibility Issue
Problem: Older versions of pdfjs-dist caused rendering failures and import errors, especially with modern module syntax.
Solution: Upgraded to "pdfjs-dist": "^3.11.174" to ensure compatibility and stable PDF rendering.

### 2. 📱 Touch Support for Mobile & Tablets
Problem: The app initially worked only on desktops due to reliance on mouse event handlers. Touch devices couldn’t interact with annotations or signatures.
Solution: Implemented touch event handlers (touchstart, touchmove, touchend) alongside existing mouse events to provide a smooth and responsive mobile experience.



## 📸 Screenshots

![Application Preview](https://frontend-test-jeff.vercel.app/og-image.png)
*Preview of the application interface*



## ⚙️ Setup Instructions

1. **Clone the Repository**

```bash
git clone https://github.com/Tachy-22/frontend-test-jeff.git
cd frontend-test-jeff
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
