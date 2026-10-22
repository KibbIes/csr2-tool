import { createFileRoute } from "@tanstack/react-router";
import { NsbBench } from "@/components/nsb-bench";
import React, { useState } from "react";

export const Route = createFileRoute("/")({ component: () => {
  const [result, setResult] = useState(null);

  const handleBuildNSB = async () => {
    try {
      const response = await fetch("http://localhost:8000/build", {
        method: "POST",
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult("Error: " + error);
    }
  };

  return (
    <div>
      <NsbBench />
      <button onClick={handleBuildNSB}>Build NSB</button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
} });
