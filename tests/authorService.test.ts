import app from "../server";
import request from "supertest";
import Author from "../models/author";

describe("Verify GET /authors", () => {
  const mockAuthors = [
    { name: "Tagore, Robi", lifespan: "1900 - 2000" },
    { name: "Austen, Jane", lifespan: "1950 - 2010" },
    { name: "Ghosh, Amitav", lifespan: "1980 - 2020" },
    { name: "Plath, Sylvia", lifespan: "1927 - 1964" },
  ];

  let consoleSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it("should respond with a list of author names and lifetimes sorted by family name of the authors", async () => {
    const expectedResponse = [...mockAuthors].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    Author.getAllAuthors = jest.fn().mockImplementationOnce((sortOpts) => {
      if (sortOpts && sortOpts.family_name === 1) {
        return Promise.resolve(expectedResponse);
      }
      return Promise.resolve(mockAuthors);
    });

    const response = await request(app).get(`/authors`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual(expectedResponse);
  });

  it("should respond with a 'No authors found' message when there are no authors in the database", async () => {
    Author.getAllAuthors = jest.fn().mockImplementationOnce(() => {
      return Promise.resolve([]);
    });
    const response = await request(app).get(`/authors`);
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe(`No authors found`);
  });

  it("should return 500 if an error occurs when retrieving the authors", async () => {
    Author.getAllAuthors = jest.fn().mockRejectedValue(() => {
      return new Error("Database error");
    });
    const response = await request(app).get(`/authors`);
    expect(response.statusCode).toBe(500);
    expect(response.text).toBe(`No authors found`);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
