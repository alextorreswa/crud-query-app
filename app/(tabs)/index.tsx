import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

const API_URL = "https://jsonplaceholder.typicode.com/posts";

function PostsScreen() {
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [patchTitle, setPatchTitle] = useState("");

  const fetchPosts = async () => {
    const url = userId ? `${API_URL}?userId=${userId}` : API_URL;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }

    return response.json();
  };

  const {
    data: posts,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["posts", userId],
    queryFn: fetchPosts,
  });

  const createPost = useMutation({
    mutationFn: async (newPost: any) => {
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(newPost),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      });

      return response.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });

      setTitle("");
      setBody("");

      Alert.alert("Success", "Post created!");
    },
  });

  const updatePost = useMutation({
    mutationFn: async (updatedPost: any) => {
      const response = await fetch(`${API_URL}/${updatedPost.id}`, {
        method: "PUT",
        body: JSON.stringify(updatedPost),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      });

      return response.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });

      setEditId(null);
      setTitle("");
      setBody("");

      Alert.alert("Updated", "Post updated with PUT!");
    },
  });

  const patchPost = useMutation({
    mutationFn: async ({
      id,
      title,
    }: {
      id: number;
      title: string;
    }) => {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      });

      return response.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });

      setPatchTitle("");

      Alert.alert("Patched", "Title updated!");
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      return id;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });

      Alert.alert("Deleted", "Post deleted!");
    },
  });

  const handleSubmit = () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Validation Error", "Title and body are required.");
      return;
    }

    if (editId) {
      updatePost.mutate({
        id: editId,
        title,
        body,
        userId: 1,
      });
    } else {
      createPost.mutate({
        title,
        body,
        userId: 1,
      });
    }
  };

  const startEdit = (post: any) => {
    setEditId(post.id);
    setTitle(post.title);
    setBody(post.body);
  };

  const handlePatch = (id: number) => {
    if (!patchTitle.trim()) {
      Alert.alert("Validation Error", "Enter a title.");
      return;
    }

    patchPost.mutate({
      id,
      title: patchTitle,
    });
  };

  if (isPending) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading posts...</Text>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>{error.message}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>CRUD Query App</Text>

      <TextInput
        style={styles.input}
        placeholder="Filter by User ID"
        value={userId}
        onChangeText={setUserId}
        keyboardType="numeric"
      />

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Post title"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Post body"
          value={body}
          onChangeText={setBody}
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>
            {editId ? "Update Post" : "Create Post"}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <Text style={styles.postTitle}>{item.title}</Text>

            <Text>{item.body}</Text>

            <Text style={styles.userText}>
              User ID: {item.userId}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Patch title"
              value={patchTitle}
              onChangeText={setPatchTitle}
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => startEdit(item)}
              >
                <Text style={styles.buttonText}>PUT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => handlePatch(item.id)}
              >
                <Text style={styles.buttonText}>PATCH</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deletePost.mutate(item.id)}
              >
                <Text style={styles.buttonText}>DELETE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  return (
    <QueryClientProvider client={queryClient}>
      <PostsScreen />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f4f4f4",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  heading: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },

  card: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },

  postCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },

  input: {
    backgroundColor: "#e5e7eb",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  textArea: {
    height: 80,
    textAlignVertical: "top",
  },

  button: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  smallButton: {
    backgroundColor: "#2563eb",
    padding: 8,
    borderRadius: 8,
    marginRight: 6,
  },

  deleteButton: {
    backgroundColor: "#dc2626",
    padding: 8,
    borderRadius: 8,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
  },

  postTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },

  userText: {
    marginTop: 6,
    marginBottom: 10,
    fontStyle: "italic",
  },

  row: {
    flexDirection: "row",
  },
});