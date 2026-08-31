import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "./input";

describe("Input", () => {
  it("associates the label with the input via a derived id", () => {
    render(<Input label="Email" />);
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    expect(input.id).toBe("email");
  });

  it("uses the explicit id over the derived one when both are given", () => {
    render(<Input label="Email address" id="custom-id" />);
    const input = screen.getByLabelText("Email address") as HTMLInputElement;
    expect(input.id).toBe("custom-id");
  });

  it("renders no label element when label is omitted", () => {
    const { container } = render(<Input placeholder="jane@example.com" />);
    expect(container.querySelector("label")).toBeNull();
  });

  it("shows the error message and applies the error border class", () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText("Invalid email")).toBeDefined();
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    expect(input.className).toContain("border-red-500");
  });

  it("forwards native input props", () => {
    render(<Input label="Email" type="email" placeholder="jane@example.com" required />);
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    expect(input.type).toBe("email");
    expect(input.placeholder).toBe("jane@example.com");
    expect(input.required).toBe(true);
  });
});
