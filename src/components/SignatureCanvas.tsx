import React, { useRef, useState } from "react";
import SignaturePad from "react-signature-canvas";
import { useDocument } from "@/contexts/DocumentContext";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SignatureCanvas: React.FC = () => {
  const { addAnnotation, currentPage, annotationColor, setActiveAnnotation } =
    useDocument();
  const sigCanvas = useRef<SignaturePad>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) {
      toast({
        title: "Empty signature",
        description: "Please draw your signature before saving",
        variant: "destructive",
      });
      return;
    }

    // Get the signature as an image
    const signatureData = sigCanvas.current
      ?.getTrimmedCanvas()
      .toDataURL("image/png");

    // Add the signature annotation
    addAnnotation({
      type: "signature",
      pageNumber: currentPage,
      position: {
        x: 100, // Default position, in a real app would be placed by the user
        y: 100,
        width: 200,
        height: 100,
      },
      imageData: signatureData,
    });

    toast({
      title: "Signature added",
      description: "Your signature has been added to the document",
    });

    // Clear the canvas
    clear();
  };

  return (
    <div className="mt-8  rounded-lg bg-white">
      <p className="text-sm mb-2">Draw your signature:</p>

      <div className="border border-border rounded cursor-pointer">
        <SignaturePad
          ref={sigCanvas}
          canvasProps={{
            className: "w-full h-32",
          }}
          penColor={annotationColor}
          onBegin={() => setIsEmpty(false)}
        />
      </div>

      <div className="flex gap-2 mt-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={clear}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>

        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={() => {
            save();
            setActiveAnnotation(null);
          }}
          disabled={isEmpty}
        >
          <Check className="h-4 w-4 mr-1" />
          Apply
        </Button>
      </div>
    </div>
  );
};

export default SignatureCanvas;
