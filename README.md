# Formula Input

## Introduction
This project builds a *FormulaInput* in React, which provides a content-editable \<DIV> with the following special treatment of text inside the \<DIV>:
* Variable names, i.e. text between square brackets, are highlighted in a special color
* Pressing the delete or backspace key on a variable deletes the entire variable (rather than just one character).
* Editing of variable names is disallowed, i.e. keystrokes issued while inside a variable name are ignored.
* When copying formula fragments from the FormulaInput component, the fragment is automatically extended to cover entire variable names
* When copying formulas into the FormulaInput component, the formula is automaticaly restyled to highlight variables.

The *FormulaInput* component was successfully manually tested on a MacBook, Ubuntu and Windows laptop in Chromium-based browsers (Chrome, Edge, Brave) and on a MacBook in FireFox. It does not work in Safari.

My reason for doing this project was experimenting with the *content-editable* property for HTML elements and with direct DOM manipulation of a React component. Alas, the *content-editable* feature is notoriously difficult in that support across browsers is inconsistent. 

## Getting started
This project was created as a [React app with TypeScript support](https://create-react-app.dev/docs/adding-typescript/) and uses *styled components*. After cloning the project, you will need to run `yarn install` and then `yarn start` to start the development server.
You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).
To learn React, check out the [React documentation](https://reactjs.org/).
