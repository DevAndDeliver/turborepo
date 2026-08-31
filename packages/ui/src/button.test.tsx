import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeDefined();
  });

  it("applies the primary variant by default", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button", { name: "Go" }).className).toContain("bg-emerald-500");
  });

  it("applies the outline variant when passed", () => {
    render(<Button variant="outline">Go</Button>);
    expect(screen.getByRole("button", { name: "Go" }).className).toContain("border-zinc-700");
  });

  it("respects the disabled prop", () => {
    render(<Button disabled>Go</Button>);
    const button = screen.getByRole("button", { name: "Go" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
