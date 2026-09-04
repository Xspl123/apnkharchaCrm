const INVALID_EXPRESSION_PATTERN = /[^0-9+\-*/%.() ]/;
const TOKEN_PATTERN = /(\d+(?:\.\d+)?)|[+\-*/()]|%/g;
const OPERATOR_PRECEDENCE = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
};

export const sanitizeCalculatorExpression = (value = "") => value.replace(/\s+/g, "");

const tokenizeExpression = (expression) => {
    const tokens = expression.match(TOKEN_PATTERN) || [];

    if (tokens.join("") !== expression) {
        throw new Error("Only numeric operators are allowed.");
    }

    return tokens;
};

const toPostfix = (tokens) => {
    const output = [];
    const operators = [];

    tokens.forEach((token) => {
        if (!Number.isNaN(Number(token))) {
            output.push(Number(token));
            return;
        }

        if (token === "%") {
            const previous = output.pop();

            if (previous === undefined) {
                throw new Error("Invalid percentage usage.");
            }

            output.push(previous / 100);
            return;
        }

        if (token === "(") {
            operators.push(token);
            return;
        }

        if (token === ")") {
            while (operators.length && operators[operators.length - 1] !== "(") {
                output.push(operators.pop());
            }

            if (operators.pop() !== "(") {
                throw new Error("Mismatched parentheses.");
            }

            return;
        }

        while (
            operators.length &&
            operators[operators.length - 1] !== "(" &&
            OPERATOR_PRECEDENCE[operators[operators.length - 1]] >= OPERATOR_PRECEDENCE[token]
        ) {
            output.push(operators.pop());
        }

        operators.push(token);
    });

    while (operators.length) {
        const operator = operators.pop();

        if (operator === "(") {
            throw new Error("Mismatched parentheses.");
        }

        output.push(operator);
    }

    return output;
};

const evaluatePostfix = (tokens) => {
    const stack = [];

    tokens.forEach((token) => {
        if (typeof token === "number") {
            stack.push(token);
            return;
        }

        const right = stack.pop();
        const left = stack.pop();

        if (left === undefined || right === undefined) {
            throw new Error("Please enter a valid calculation.");
        }

        switch (token) {
            case "+":
                stack.push(left + right);
                break;
            case "-":
                stack.push(left - right);
                break;
            case "*":
                stack.push(left * right);
                break;
            case "/":
                stack.push(left / right);
                break;
            default:
                throw new Error("Unsupported operator.");
        }
    });

    if (stack.length !== 1) {
        throw new Error("Please enter a valid calculation.");
    }

    return stack[0];
};

export const evaluateCalculatorExpression = (expression) => {
    const normalizedExpression = sanitizeCalculatorExpression(expression);

    if (!normalizedExpression) {
        throw new Error("Please enter a calculation.");
    }

    if (INVALID_EXPRESSION_PATTERN.test(normalizedExpression)) {
        throw new Error("Only numeric operators are allowed.");
    }

    const tokens = tokenizeExpression(normalizedExpression);
    const result = evaluatePostfix(toPostfix(tokens));

    if (!Number.isFinite(result)) {
        throw new Error("Invalid calculation result.");
    }

    return result;
};

export const formatCalculatorResult = (value) => {
    const roundedValue = Number.parseFloat(Number(value).toFixed(2));

    if (!Number.isFinite(roundedValue)) {
        throw new Error("Invalid calculation result.");
    }

    return roundedValue.toString();
};
