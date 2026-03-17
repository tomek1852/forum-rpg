import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("renders authentication calls to action", () => {
    render(<Home />);

    expect(
      screen.getByRole("link", { name: /zaloz konto/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /zaloguj sie/i }),
    ).toBeInTheDocument();
  });
});
