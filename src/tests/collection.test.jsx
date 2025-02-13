import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from 'vitest';
import axios from "axios";
import CollectionPage from "../pages/collection";
import '@testing-library/jest-dom';

vi.mock("axios"); // Mock Axios

const mockCollection = {
  _id: "1",
  collectionName: "SpiderMan Comics",
  comics: [
    {
      _id: "101",
      title: "Spider-Man",
      creators: [{ role: "Writer", name: "Stan Lee" }],
      description: "A story about Spider-Man.",
    },
  ],
};

const mockComics = [
  {
    _id: "102",
    title: "Iron Man",
    creators: [{ role: "Writer", name: "Stan Lee" }],
  },
];

describe("CollectionPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    axios.get.mockImplementation((url) => {
        if (url.includes("/collections/")) {
            return Promise.resolve({ data: mockCollection });
          }
          if (url.includes("/comics")) {
            return Promise.resolve({ data: mockComics });
          }
          return Promise.reject(new Error("Not found"));
    });
  });

  function renderWithRouter(id) {
    render(
      <MemoryRouter initialEntries={[`/collections/${id}`]}>
        <Routes>
          <Route path="/collections/:id" element={<CollectionPage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  test("displays loading state initially", async () => {
    axios.get.mockResolvedValueOnce({ data: mockCollection });
    axios.get.mockResolvedValueOnce({ data: mockComics });

    renderWithRouter("1");

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    expect(await screen.findByText(/SpiderMan Comics/i)).toBeInTheDocument();
  });

  test("renders collection details after fetching data", async () => {
    axios.get.mockResolvedValueOnce({ data: mockCollection });
    axios.get.mockResolvedValueOnce({ data: mockComics });

    renderWithRouter("1");

    await waitFor(() => {
      expect(screen.getByText("SpiderMan Comics")).toBeInTheDocument();
      expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      expect(screen.getByText("A story about Spider-Man.")).toBeInTheDocument();
    });
  });

  test("opens the Add Comic modal when clicking 'Add Comic'", async () => {
    axios.get.mockResolvedValueOnce({ data: mockCollection });
    axios.get.mockResolvedValueOnce({ data: mockComics });

    renderWithRouter("1");

    await waitFor(() => screen.getByText("Add Comic"));

    fireEvent.click(screen.getByText("Add Comic"));

    await waitFor(() => {
      expect(screen.getByText("Select a Comic to Add")).toBeInTheDocument();
      expect(screen.getByText("Iron Man")).toBeInTheDocument();
    });
  });

  test("calls API to add comic to collection", async () => {
    axios.get.mockResolvedValueOnce({ data: mockCollection });
    axios.get.mockResolvedValueOnce({ data: mockComics });

    axios.post.mockResolvedValueOnce({ data: { ...mockCollection, comics: [...mockCollection.comics, mockComics[0]] } });

    renderWithRouter("1");

    await waitFor(() => screen.getByText("Add Comic"));
    fireEvent.click(screen.getByText("Add Comic"));

    await waitFor(() => screen.getByText("Iron Man"));
    fireEvent.click(screen.getByRole("button", { name: /Add to Collection/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("http://localhost:5000/collections/1/add-comic", { comicId: "102" });
    });
  });

  test("handles error when adding a comic", async () => {
    axios.get.mockResolvedValueOnce({ data: mockCollection });
    axios.get.mockResolvedValueOnce({ data: mockComics });

    axios.post.mockRejectedValueOnce(new Error("Failed to add comic"));

    renderWithRouter("1");

    await waitFor(() => screen.getByText("Add Comic"));
    fireEvent.click(screen.getByText("Add Comic"));

    await waitFor(() => screen.getByText("Iron Man"));
    fireEvent.click(screen.getByRole("button", { name: /Add to Collection/i }));

    await waitFor(() => {
      expect(screen.getByText("Failed to add comic")).toBeInTheDocument();
    });
  });
});
