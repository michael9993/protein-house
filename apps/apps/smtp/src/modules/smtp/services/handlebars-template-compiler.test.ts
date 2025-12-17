import { describe, expect, it } from "vitest";

import { HandlebarsTemplateCompiler } from "./handlebars-template-compiler";

describe("HandlebarsTemplateCompiler", () => {
  it("Compiles template", () => {
    const compiler = new HandlebarsTemplateCompiler();
    const result = compiler.compile("Template {{foo}}", { foo: "bar" });

    expect(result._unsafeUnwrap()).toStrictEqual({ template: "Template bar" });
  });

  it("Returns error if compilation failed", () => {
    const compiler = new HandlebarsTemplateCompiler();
    const result = compiler.compile("{{{", { foo: "bar" });

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(HandlebarsTemplateCompiler.FailedCompileError);
  });

  it("Supports syntax from handlebars helpers", () => {
    const template = `{{#is foo "bar"}}I should render{{else}}I should render otherwise{{/is}}`;

    const compiler = new HandlebarsTemplateCompiler();
    const result1 = compiler.compile(template, { foo: "bar" });
    const result2 = compiler.compile(template, { foo: "not-bar" });

    expect(result1._unsafeUnwrap()).toStrictEqual({
      template: "I should render",
    });

    expect(result2._unsafeUnwrap()).toStrictEqual({
      template: "I should render otherwise",
    });
  });

  it("Formats dates using formatDate helper", () => {
    const template = `Order Date: {{formatDate date}}`;
    const compiler = new HandlebarsTemplateCompiler();
    
    const result = compiler.compile(template, { 
      date: "2024-12-15T14:21:52.361Z" 
    });

    const output = result._unsafeUnwrap().template;
    
    // Should format as a readable date (e.g., "December 15, 2024, 2:21 PM")
    expect(output).toContain("Order Date:");
    expect(output).toContain("December");
    expect(output).toContain("2024");
    expect(output).toContain("PM");
  });

  it("Handles missing date gracefully in formatDate helper", () => {
    const template = `Order Date: {{formatDate date}}`;
    const compiler = new HandlebarsTemplateCompiler();
    
    const result = compiler.compile(template, { date: null });

    expect(result._unsafeUnwrap()).toStrictEqual({
      template: "Order Date: ",
    });
  });

  it("Handles invalid date gracefully in formatDate helper", () => {
    const template = `Order Date: {{formatDate date}}`;
    const compiler = new HandlebarsTemplateCompiler();
    
    const result = compiler.compile(template, { date: "not-a-date" });

    const output = result._unsafeUnwrap().template;
    
    // Should fallback to raw value
    expect(output).toContain("not-a-date");
  });
});
