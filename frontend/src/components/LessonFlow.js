import React, { useState } from "react";

import Microleccion1 from "./microleccion1";
import Microleccion2 from "./microleccion2";
import MultipleChoice from "./MultipleChoice";
import DescansoCard from "./descansoCard";
import NumericExercise from "./NumericExercise";
import ExitosCard from "./ExitosCard";
import FinalizacionCard from "./FinalizacionCard";
import TarjetaProgreso from "./TarjetaProgreso";

function LessonFlow() {

  const [step, setStep] = useState(1);

  const nextStep = () => {
    setStep((prev) => prev + 1);
  };

  return (
    <div className="lesson-flow">

      {step === 1 && (
        <Microleccion1 onContinuar={nextStep} />
      )}

      {step === 2 && (
        <Microleccion2 onContinuar={nextStep} />
      )}

      {step === 3 && (
        <MultipleChoice onComplete={nextStep} />
      )}

      {step === 4 && (
        <DescansoCard onComplete={nextStep} />
      )}

      {step === 5 && (
        <NumericExercise onComplete={nextStep} />
      )}

      {step === 6 && (
        <ExitosCard onComplete={nextStep} />
      )}

      {step === 7 && (
        <FinalizacionCard onComplete={nextStep} />
      )}

      {step === 8 && (
        <TarjetaProgreso />
      )}

    </div>
  );
}

export default LessonFlow;