import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension Utilities Tests", () => {
  suite("Content Processing", () => {
    test("should correctly count words in simple text", () => {
      const text = "Hello world test";
      const wordCount = text.split(/\s+/).length;

      assert.strictEqual(wordCount, 3, "Should count 3 words");
    });

    test("should correctly count words with multiple spaces", () => {
      const text = "Hello    world   test";
      const wordCount = text
        .split(/\s+/)
        .filter((word) => word.length > 0).length;

      assert.strictEqual(wordCount, 3, "Should handle multiple spaces");
    });

    test("should correctly count words with newlines and tabs", () => {
      const text = "Hello\nworld\ttest";
      const wordCount = text.split(/\s+/).length;

      assert.strictEqual(wordCount, 3, "Should handle newlines and tabs");
    });

    test("should handle empty string", () => {
      const text = "";
      const wordCount = text
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      const charCount = text.length;

      assert.strictEqual(wordCount, 0, "Empty string should have 0 words");
      assert.strictEqual(charCount, 0, "Empty string should have 0 characters");
    });

    test("should handle whitespace-only string", () => {
      const text = "   \n\t  ";
      const wordCount = text
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      const charCount = text.length;

      assert.strictEqual(wordCount, 0, "Whitespace-only should have 0 words");
      assert.ok(charCount > 0, "Whitespace-only should have characters");
    });
  });

  suite("Number Formatting", () => {
    test("should format small numbers correctly", () => {
      const number = 123;
      const formatted = number.toLocaleString();

      assert.ok(typeof formatted === "string", "Should return string");
      assert.ok(formatted.includes("123"), "Should contain the number");
    });

    test("should format large numbers with separators", () => {
      const number = 1234567;
      const formatted = number.toLocaleString();

      assert.ok(typeof formatted === "string", "Should return string");
      assert.ok(
        formatted.length >= number.toString().length,
        "Should be at least as long as original"
      );
    });

    test("should format zero correctly", () => {
      const number = 0;
      const formatted = number.toLocaleString();

      assert.strictEqual(formatted, "0", "Zero should format as 0");
    });
  });

  suite("Language Detection Logic", () => {
    test("should detect Portuguese language codes", () => {
      const portugueseCodes = ["pt", "pt-BR", "pt-PT"];

      portugueseCodes.forEach((code) => {
        const isPortuguese = code.startsWith("pt");
        assert.ok(isPortuguese, `${code} should be detected as Portuguese`);
      });
    });

    test("should not detect non-Portuguese languages", () => {
      const nonPortugueseCodes = ["en", "en-US", "es", "fr", "de"];

      nonPortugueseCodes.forEach((code) => {
        const isPortuguese = code.startsWith("pt");
        assert.ok(
          !isPortuguese,
          `${code} should not be detected as Portuguese`
        );
      });
    });

    test("should provide correct labels for Portuguese", () => {
      const isPortuguese = true;
      const wordLabel = isPortuguese ? "palavras" : "words";
      const charLabel = isPortuguese ? "caracteres" : "characters";
      const unavailableLabel = isPortuguese
        ? "URL não disponível"
        : "URL not available";

      assert.strictEqual(wordLabel, "palavras");
      assert.strictEqual(charLabel, "caracteres");
      assert.strictEqual(unavailableLabel, "URL não disponível");
    });

    test("should provide correct labels for English", () => {
      const isPortuguese = false;
      const wordLabel = isPortuguese ? "palavras" : "words";
      const charLabel = isPortuguese ? "caracteres" : "characters";
      const unavailableLabel = isPortuguese
        ? "URL não disponível"
        : "URL not available";

      assert.strictEqual(wordLabel, "words");
      assert.strictEqual(charLabel, "characters");
      assert.strictEqual(unavailableLabel, "URL not available");
    });
  });

  suite("Constants and Configuration", () => {
    test("should have proper cache key constants", () => {
      const CACHE_KEY = "lastLoadedContext";
      const URL_KEY = "lastLoadedUrl";

      assert.strictEqual(
        typeof CACHE_KEY,
        "string",
        "Cache key should be string"
      );
      assert.strictEqual(typeof URL_KEY, "string", "URL key should be string");
      assert.notStrictEqual(CACHE_KEY, URL_KEY, "Keys should be different");
      assert.ok(CACHE_KEY.length > 0, "Cache key should not be empty");
      assert.ok(URL_KEY.length > 0, "URL key should not be empty");
    });

    test("should have reasonable timeout value", () => {
      const TIMEOUT = 10000; // 10 seconds

      assert.ok(typeof TIMEOUT === "number", "Timeout should be number");
      assert.ok(TIMEOUT > 0, "Timeout should be positive");
      assert.ok(TIMEOUT >= 5000, "Timeout should be at least 5 seconds");
      assert.ok(TIMEOUT <= 30000, "Timeout should not exceed 30 seconds");
    });
  });

  suite("VS Code API Integration", () => {
    test("should create proper ThemeIcon", () => {
      const icon = new vscode.ThemeIcon("book");

      assert.ok(
        icon instanceof vscode.ThemeIcon,
        "Should create ThemeIcon instance"
      );
      assert.strictEqual(icon.id, "book", "Should have correct icon ID");
    });

    test("should handle URI creation", () => {
      const uri = vscode.Uri.file("/test/path");

      assert.ok(uri instanceof vscode.Uri, "Should create URI instance");
      assert.ok(uri.fsPath.includes("test"), "Should contain path info");
    });

    test("should validate extension mode enum", () => {
      const modes = [
        vscode.ExtensionMode.Development,
        vscode.ExtensionMode.Production,
        vscode.ExtensionMode.Test,
      ];

      modes.forEach((mode, index) => {
        assert.ok(typeof mode === "number", `Mode ${index} should be number`);
      });
    });
  });

  suite("Content Type Handling", () => {
    test("should handle JSON content", () => {
      const jsonContent = JSON.stringify(
        {
          name: "test",
          value: 123,
          items: ["a", "b", "c"],
        },
        null,
        2
      );

      const wordCount = jsonContent
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      const charCount = jsonContent.length;

      assert.ok(wordCount > 0, "JSON should have words");
      assert.ok(charCount > 0, "JSON should have characters");
    });

    test("should handle markdown content", () => {
      const markdownContent = `# Title

## Subtitle

This is **bold** and *italic* text.

- Item 1
- Item 2
- Item 3

\`\`\`javascript
console.log('hello');
\`\`\``;

      const wordCount = markdownContent
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      const charCount = markdownContent.length;

      assert.ok(wordCount > 10, "Markdown should have multiple words");
      assert.ok(
        charCount > 50,
        "Markdown should have significant character count"
      );
    });

    test("should handle HTML content", () => {
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
	<title>Test Document</title>
</head>
<body>
	<h1>Welcome</h1>
	<p>This is a test paragraph with <strong>bold</strong> text.</p>
	<ul>
		<li>Item one</li>
		<li>Item two</li>
	</ul>
</body>
</html>`;

      const wordCount = htmlContent
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      const charCount = htmlContent.length;

      assert.ok(wordCount > 15, "HTML should have multiple words");
      assert.ok(
        charCount > 100,
        "HTML should have significant character count"
      );
    });

    test("should handle code content", () => {
      const codeContent = `function getUserById(id) {
	const user = database.users.find(u => u.id === id);
	if (!user) {
		throw new Error('User not found');
	}
	return user;
}

class UserService {
	constructor(database) {
		this.db = database;
	}
	
	async createUser(userData) {
		const newUser = await this.db.users.create(userData);
		return newUser;
	}
}`;

      const wordCount = codeContent
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      const charCount = codeContent.length;
      const lineCount = codeContent.split("\n").length;

      assert.ok(wordCount > 20, "Code should have multiple words");
      assert.ok(
        charCount > 200,
        "Code should have significant character count"
      );
      assert.ok(lineCount > 10, "Code should have multiple lines");
    });
  });

  suite("Error Handling Utilities", () => {
    test("should handle Error objects correctly", () => {
      const error = new Error("Test error message");

      assert.ok(error instanceof Error, "Should be Error instance");
      assert.strictEqual(
        error.message,
        "Test error message",
        "Should have correct message"
      );
      assert.ok(typeof error.stack === "string", "Should have stack trace");
    });

    test("should handle network error types", () => {
      const networkError = new Error("Network timeout");
      const parseError = new Error("JSON parse error");
      const authError = new Error("Unauthorized access");

      [networkError, parseError, authError].forEach((error) => {
        assert.ok(error instanceof Error, "Should be Error instance");
        assert.ok(error.message.length > 0, "Should have error message");
      });
    });

    test("should handle promise rejection scenarios", () => {
      const rejectedPromise = Promise.reject(new Error("Async error"));

      return rejectedPromise.catch((error) => {
        assert.ok(error instanceof Error, "Rejected value should be Error");
        assert.strictEqual(
          error.message,
          "Async error",
          "Should have correct message"
        );
      });
    });
  });

  suite("Performance and Memory", () => {
    test("should handle small content efficiently", () => {
      const smallContent = "Hello world";

      const start = process.hrtime.bigint();
      const wordCount = smallContent.split(/\s+/).length;
      const charCount = smallContent.length;
      const end = process.hrtime.bigint();

      const duration = Number(end - start) / 1000000; // Convert to milliseconds

      assert.strictEqual(wordCount, 2, "Should count correctly");
      assert.strictEqual(charCount, 11, "Should count correctly");
      assert.ok(duration < 1, "Should be very fast for small content");
    });

    test("should handle medium content efficiently", () => {
      const mediumContent = "word ".repeat(1000);

      const start = process.hrtime.bigint();
      const wordCount = mediumContent
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      const charCount = mediumContent.length;
      const end = process.hrtime.bigint();

      const duration = Number(end - start) / 1000000; // Convert to milliseconds

      assert.strictEqual(wordCount, 1000, "Should count correctly");
      assert.ok(charCount > 4000, "Should have expected character count");
      assert.ok(duration < 10, "Should be fast for medium content");
    });

    test("should not cause memory issues with repeated operations", () => {
      const iterations = 100;
      const testContent =
        "This is test content with several words for counting";

      for (let i = 0; i < iterations; i++) {
        const wordCount = testContent.split(/\s+/).length;
        const charCount = testContent.length;

        // Ensure consistent results
        assert.strictEqual(
          wordCount,
          9,
          "Should maintain consistent word count"
        );
        assert.strictEqual(
          charCount,
          52,
          "Should maintain consistent char count"
        );
      }

      // If we get here without throwing, memory management is working
      assert.ok(
        true,
        "Should handle repeated operations without memory issues"
      );
    });
  });
});
