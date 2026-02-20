// @ts-strict-ignore
import { render, screen } from "@testing-library/react";

import { TimezoneProvider } from "../Timezone";
import Date from "./Date";

const testDate = "2018-04-07";
const expectedDate = "Apr 7, 2018";

describe("Date", () => {
  it("Render plain date with timezone GMT-11", () => {
    // Arrange & Act
    render(
      <TimezoneProvider value="Pacific/Midway">
        <Date date={testDate} plain />
      </TimezoneProvider>,
    );
    // Assert
    expect(screen.queryByText(expectedDate)).toBeInTheDocument();
  });
  it("Render plain date with timezone GMT+13", () => {
    // Arrange & Act
    render(
      <TimezoneProvider value="Pacific/Tongatapu">
        <Date date={testDate} plain />
      </TimezoneProvider>,
    );
    // Assert
    expect(screen.queryByText(expectedDate)).toBeInTheDocument();
  });
  it("Render humanized date with timezone GMT-11", () => {
    // Arrange & Act
    const { container } = render(
      <TimezoneProvider value="Pacific/Midway">
        <Date date={testDate} />
      </TimezoneProvider>,
    );
    // Assert — use container query as Radix Tooltip may not render in jsdom
    const timeEl = container.querySelector("time[data-test-id='dateTime']");

    expect(timeEl).toBeTruthy();
    expect(timeEl?.getAttribute("dateTime") ?? timeEl?.getAttribute("datetime")).toEqual(testDate);
  });
  it("Render humanized date with timezone GMT+13", () => {
    // Arrange & Act
    const { container } = render(
      <TimezoneProvider value="Pacific/Tongatapu">
        <Date date={testDate} />
      </TimezoneProvider>,
    );
    // Assert — use container query as Radix Tooltip may not render in jsdom
    const timeEl = container.querySelector("time[data-test-id='dateTime']");

    expect(timeEl).toBeTruthy();
    expect(timeEl?.getAttribute("dateTime") ?? timeEl?.getAttribute("datetime")).toEqual(testDate);
  });
});
