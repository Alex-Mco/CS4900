# Marvel Nexus

# About

Marvel Nexus is a web application designed with the comic enthusiast in mind. It is a website that allows the user to track and manage comics. It browses the marvel api for comics kept in their database and returns the information in an easy to read and view format. Allowing users to select comics while browsing to add to their own personal collecions to keep track of comics they own, comics they want, or even just their favorites. 

## Installation & Setup

### Prerequisites:
<li>Nodes.js</li>
<li>MongoDB (cloud version)</li>
<li>Marvel API</li>
<li>>Vite</li>
<li>Jest</li>

### Steps
2. Clone the repo
   ```sh
   git clone https://github.com/Alex-Mco/CS4900.git
   ```
2. Install Dependencies
    ```sh
    npm install
    ```
3. Set up environment vairables:
    - Create a `.env` file in the backend directory
    - Add the following:
    ```sh
    PORT=5000
    MARVEL_PUBLIC_KEY=YOUR_MARVEL_PUBLIC_KEY
    MARVEL_PRIVATE_KEY=YOUR_MARVEL_PRIVATE_KEY
    MARVEL_BASE_URL=https://gateway.marvel.com/v1/public/comics
    MONGO_URL=YOUR_MONGO_URL
    GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
    GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
    ```
5. Start the backend server:
   ```sh
   npm start
    ```
7. Start the frontend application:
   ```sh
   npm run preview
    ```
   OR
   ```sh
   npm run dev
   ```
9. Access the website with preview: http://localhost:5173
    Access the website with dev: http://localhost:4173
    

## Usage
### Browsing Comics

<li>Users can browse the vast collection of comics available in the Marvel API.</li>
<li>Comics are displayed with details such as title, cover image, issue number, and description.</li>

### Searching & Filtering

<li>Users can search for specific comics by title.</li>
<li>Filtering options allow users to refine their search based on series, character appearances, and publication dates.</li>

### Managing Collections

<li>Users can create personalized collections to track comics they own, want, or have marked as favorites.</li>
<li>Adding a comic to a collection updates the user’s personal dashboard.</li>

## Contributors
<li>Alex Mcomber - Full Stack Developer</li>
