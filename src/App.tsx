import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import {
  getCurrentUser,
  signInWithRedirect,
  signOut,
  fetchUserAttributes,
} from "aws-amplify/auth";
const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [userName, setUserName] = useState<string>("");

  function listTodos() {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  async function checkUserAuthentication() {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const attributes = await fetchUserAttributes();
        const displayName =
          attributes.email || currentUser.username || currentUser.userId;
        setUserName(displayName);
        return true;
      }
    } catch (error) {
      console.error("Error getting current user:", error);
      setUserName("");
      return false;
    }
  }

  useEffect(() => {
    const fetchTodos = async () => {
      const isAuthenticated = await checkUserAuthentication();
      if (isAuthenticated) {
        listTodos();
      }
    };
    fetchTodos();
  }, []);

  function createTodo() {
    client.models.Todo.create({
      content: window.prompt("Todo content"),
    });
  }

  const handleSignOut = async () => {
    await signOut();
    setUserName("");
  };

  return (
    <main>
      {userName ? (
        <div>
          <h1>Welcome {userName}</h1>
          <h1>My Todos</h1>
          <button onClick={createTodo}>+ new</button>
          <ul>
            {todos.map((todo) => (
              <li key={todo.id} onClick={() => deleteTodo(todo.id)}>
                {todo.content}
              </li>
            ))}
          </ul>
          <div>
            App successfully hosted. Try creating a new todo
            <br />
            <button onClick={handleSignOut}>Sign Out</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() =>
            signInWithRedirect({
              provider: { custom: "Auth0" },
            })
          }
        >
          Sign in with Auth0
        </button>
      )}
    </main>
  );
}

export default App;
