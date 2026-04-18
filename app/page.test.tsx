import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("renders authentication calls to action", () => {
    render(<Home />);

    expect(
      screen.getByRole("link", { name: /załóż konto/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /zaloguj się/i }),
    ).toBeInTheDocument();
  });
});
