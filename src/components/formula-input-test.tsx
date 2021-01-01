import React, { CSSProperties, useEffect, useState } from "react";
import FormulaBox, { insertVariable } from "./formula-input";

const initialValue1 = "12 + [Var 1] +\nIF([Var 2] > 5, 3, 0)";
const initialValue2 = `12 + AVERAGE(
    45% * [Var X] + 55% * [Var Y],
    MAX([Var A] - 80, 92% * [Var B])
)`;
let variable = "Very-long variable name";

enum EFormula {
  NONE,
  FORMULA1,
  FORMULA2,
}

const buttonStyle: CSSProperties = {
  backgroundColor: "blue",
  color: "white",
  borderRadius: "10px",
  padding: "11px",
  margin: "10px",
  cursor: "pointer",
};

const FormulaTest = () => {
  const [formula1, setFormula1] = useState(initialValue1);
  const [formula2, setFormula2] = useState(initialValue2);

  const [activeFormula, setActiveFormula] = useState({
    state: EFormula.FORMULA1,
  });

  useEffect(() => {
    setFormula1(initialValue1);
    setFormula2(initialValue2);
  }, []);

  return (
    <div>
      <div>
        <button
          style={buttonStyle}
          onClick={() => {
            setActiveFormula({ state: activeFormula.state });
            insertVariable(variable);
          }}
        >
          Insert: {variable}
        </button>

        <textarea
          onChange={(e) => (variable = e.target.value)}
          defaultValue={variable}
        ></textarea>
      </div>
      <button style={buttonStyle} onClick={(e) => setFormula1("A + B + C")}>
        Set Formula 1
      </button>

      <button
        style={buttonStyle}
        onClick={(e) => setFormula2("[Var X] * [Var Y]")}
      >
        Set Formula 2
      </button>

      <p>Change the formula in the gray box</p>

      <h3>Formula 1</h3>
      <FormulaBox
        formulaText={formula1}
        variableColor="#0000ff"
        setFormula={setFormula1}
        // Use {state: boolean} rather than boolean to force rerender to establish focus.
        isActive={{ state: activeFormula.state === EFormula.FORMULA1 }}
        setActive={() => setActiveFormula({ state: EFormula.FORMULA1 })}
      />
      <p>
        {activeFormula.state === EFormula.FORMULA1
          ? "I am active"
          : "I am not active"}
      </p>
      <p>
        <b>Plain text:</b> {formula1}
      </p>

      <h3>Formula 2</h3>
      <FormulaBox
        formulaText={formula2}
        variableColor="#0000ff"
        setFormula={setFormula2}
        // Use {state: boolean} rather than boolean to force rerender to establish focus.
        isActive={{ state: activeFormula.state === EFormula.FORMULA2 }}
        setActive={() => setActiveFormula({ state: EFormula.FORMULA2 })}
        readOnly={false}
      />
      <p>
        {activeFormula.state === EFormula.FORMULA2
          ? "I am active"
          : "I am not active"}
      </p>
      <p>
        <b>Plain text:</b> {formula2}
      </p>
    </div>
  );
};

export default FormulaTest;
