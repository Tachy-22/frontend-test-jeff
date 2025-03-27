import DocumentEditor from "@/components/DocumentEditor";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      <Navbar />
      <main className="pt-16">
        <DocumentEditor />
      </main>
    </div>
  );
}
