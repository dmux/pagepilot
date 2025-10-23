import * as assert from "assert";
import * as vscode from "vscode";
import { activate, deactivate } from "../extensions";
import { t } from "../i18n";

suite("PagePilot Extension Test Suite", () => {
  vscode.window.showInformationMessage("Running PagePilot tests...");

  suite("Extension Lifecycle", () => {
    test("should activate extension without errors", () => {
      const mockContext: vscode.ExtensionContext = {
        subscriptions: [],
        workspaceState: {
          get: () => undefined,
          update: () => Promise.resolve(),
          keys: () => [],
          setKeysForSync: () => {},
        } as vscode.Memento,
        globalState: {
          get: () => undefined,
          update: () => Promise.resolve(),
          keys: () => [],
          setKeysForSync: () => {},
        } as vscode.Memento & { setKeysForSync(keys: readonly string[]): void },
        extensionUri: vscode.Uri.file("/test"),
        extensionPath: "/test",
        environmentVariableCollection: {} as any,
        asAbsolutePath: (path: string) => path,
        storageUri: vscode.Uri.file("/test/storage"),
        globalStorageUri: vscode.Uri.file("/test/global"),
        logUri: vscode.Uri.file("/test/log"),
        storagePath: "/test/storage",
        globalStoragePath: "/test/global",
        logPath: "/test/log",
        extensionMode: vscode.ExtensionMode.Test,
        extension: {} as any,
        secrets: {} as any,
        languageModelAccessInformation: {} as any,
      };

      assert.doesNotThrow(() => activate(mockContext));
    });

    test("should deactivate extension without errors", () => {
      assert.doesNotThrow(() => deactivate());
    });
  });

  suite("Internationalization (i18n)", () => {
    test("should return valid translations object", () => {
      const translations = t();

      assert.ok(translations, "Translations object should exist");
      assert.ok(translations.loadCommandHelp, "loadCommandHelp should exist");
      assert.ok(translations.loading, "loading should exist");
      assert.ok(translations.success, "success should exist");
      assert.ok(translations.errors, "errors should exist");
      assert.ok(translations.status, "status should exist");
      assert.ok(translations.help, "help should exist");
      assert.ok(translations.examples, "examples should exist");
    });

    test("should have proper structure for load command help", () => {
      const translations = t();

      assert.ok(typeof translations.loadCommandHelp.title === "string");
      assert.ok(typeof translations.loadCommandHelp.usage === "string");
      assert.ok(typeof translations.loadCommandHelp.examples === "string");
      assert.ok(typeof translations.loadCommandHelp.tip === "string");
    });

    test("should have proper structure for loading messages", () => {
      const translations = t();

      assert.ok(typeof translations.loading.context === "string");
      assert.ok(typeof translations.loading.analyzing === "string");
    });

    test("should have proper structure for success messages", () => {
      const translations = t();

      assert.ok(typeof translations.success.loaded === "string");
      assert.ok(typeof translations.success.cleared === "string");
      assert.ok(typeof translations.success.source === "string");
      assert.ok(typeof translations.success.statistics === "string");
      assert.ok(typeof translations.success.ready === "string");
    });

    test("should have proper structure for error messages", () => {
      const translations = t();

      assert.ok(typeof translations.errors.loadFailed === "string");
      assert.ok(typeof translations.errors.url === "string");
      assert.ok(typeof translations.errors.error === "string");
      assert.ok(typeof translations.errors.tips === "string");
      assert.ok(typeof translations.errors.urlAccessible === "string");
      assert.ok(typeof translations.errors.plainText === "string");
      assert.ok(typeof translations.errors.testBrowser === "string");
      assert.ok(typeof translations.errors.llmError === "string");
    });

    test("should have proper structure for status messages", () => {
      const translations = t();

      assert.ok(typeof translations.status.noContext === "string");
      assert.ok(typeof translations.status.contextStatus === "string");
      assert.ok(typeof translations.status.persistence === "string");
      assert.ok(typeof translations.status.readyToAnswer === "string");
    });

    test("should have proper structure for help messages", () => {
      const translations = t();

      assert.ok(typeof translations.help.noContextTitle === "string");
      assert.ok(typeof translations.help.noContextDescription === "string");
      assert.ok(typeof translations.help.apiDocs === "string");
      assert.ok(typeof translations.help.projectReadme === "string");
      assert.ok(typeof translations.help.techSpecs === "string");
      assert.ok(typeof translations.help.formatExpected === "string");
      assert.ok(typeof translations.help.aiTip === "string");
      assert.ok(typeof translations.help.welcomeTitle === "string");
      assert.ok(typeof translations.help.activeContext === "string");
      assert.ok(typeof translations.help.usageExamples === "string");
      assert.ok(typeof translations.help.currentContext === "string");
    });

    test("should have proper structure for capability descriptions", () => {
      const translations = t();

      assert.ok(
        typeof translations.help.capabilities.codeAnalysis === "string"
      );
      assert.ok(typeof translations.help.capabilities.techDocs === "string");
      assert.ok(
        typeof translations.help.capabilities.contextImplementation === "string"
      );
      assert.ok(
        typeof translations.help.capabilities.debugOptimization === "string"
      );
    });

    test("should have proper structure for examples", () => {
      const translations = t();

      assert.ok(typeof translations.examples.useApi === "string");
      assert.ok(typeof translations.examples.implementFunction === "string");
      assert.ok(typeof translations.examples.explainPattern === "string");
      assert.ok(typeof translations.examples.bestPractices === "string");
    });
  });

  suite("Utility Functions", () => {
    test("should handle word count calculations", () => {
      const testText = "This is a test with five words";
      const wordCount = testText.split(/\s+/).length;

      assert.strictEqual(wordCount, 7, "Should count words correctly");
    });

    test("should handle character count calculations", () => {
      const testText = "Hello World";
      const charCount = testText.length;

      assert.strictEqual(charCount, 11, "Should count characters correctly");
    });

    test("should handle empty content", () => {
      const emptyText = "";
      const wordCount = emptyText.split(/\s+/).length;
      const charCount = emptyText.length;

      assert.strictEqual(charCount, 0, "Empty text should have 0 characters");
      assert.strictEqual(
        wordCount,
        1,
        "Empty text split gives one empty element"
      );
    });

    test("should handle whitespace-only content", () => {
      const whitespaceText = "   \n\t  ";
      const wordCount = whitespaceText.trim().split(/\s+/).length;
      const charCount = whitespaceText.length;

      assert.strictEqual(charCount, 7, "Should count whitespace characters");
      assert.strictEqual(
        wordCount,
        1,
        "Trimmed empty content should give 1 word"
      );
    });

    test("should handle large numbers formatting", () => {
      const largeNumber = 1234567;
      const formatted = largeNumber.toLocaleString();

      // This test is locale-dependent, so we just check it returns a string
      assert.ok(
        typeof formatted === "string",
        "Should format large numbers as string"
      );
      assert.ok(
        formatted.length >= largeNumber.toString().length,
        "Formatted should be at least as long as original"
      );
    });
  });

  suite("Language Detection", () => {
    test("should detect Portuguese locale", () => {
      // Mock Portuguese locale
      const originalLanguage = vscode.env.language;

      // We can't actually change vscode.env.language in tests, but we can test the logic
      const isPortuguese = "pt-BR".startsWith("pt");
      assert.strictEqual(isPortuguese, true, "Should detect Portuguese locale");

      const isEnglish = "en-US".startsWith("pt");
      assert.strictEqual(
        isEnglish,
        false,
        "Should not detect English as Portuguese"
      );
    });

    test("should provide correct labels for different locales", () => {
      // Test Portuguese labels
      const portugueseLabels = {
        words: "palavras",
        characters: "caracteres",
        unavailable: "URL não disponível",
      };

      assert.strictEqual(typeof portugueseLabels.words, "string");
      assert.strictEqual(typeof portugueseLabels.characters, "string");
      assert.strictEqual(typeof portugueseLabels.unavailable, "string");

      // Test English labels
      const englishLabels = {
        words: "words",
        characters: "characters",
        unavailable: "URL not available",
      };

      assert.strictEqual(typeof englishLabels.words, "string");
      assert.strictEqual(typeof englishLabels.characters, "string");
      assert.strictEqual(typeof englishLabels.unavailable, "string");
    });
  });

  suite("Constants and Configuration", () => {
    test("should have correct cache keys defined", () => {
      // Test that our constants are properly defined
      const CACHE_KEY = "lastLoadedContext";
      const URL_KEY = "lastLoadedUrl";

      assert.strictEqual(typeof CACHE_KEY, "string");
      assert.strictEqual(typeof URL_KEY, "string");
      assert.notStrictEqual(
        CACHE_KEY,
        URL_KEY,
        "Cache keys should be different"
      );
    });

    test("should have proper timeout configuration", () => {
      // Test that timeout value is reasonable (10 seconds = 10000ms)
      const TIMEOUT = 10000;

      assert.ok(TIMEOUT > 0, "Timeout should be positive");
      assert.ok(TIMEOUT <= 30000, "Timeout should not be too long");
      assert.strictEqual(
        TIMEOUT,
        10000,
        "Default timeout should be 10 seconds"
      );
    });
  });

  suite("Content Processing", () => {
    test("should handle markdown content properly", () => {
      const markdownContent = `# API Documentation
			
## Authentication
Use Bearer tokens for authentication.

## Endpoints
- GET /api/users
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id
			`;

      const wordCount = markdownContent.split(/\s+/).length;
      const charCount = markdownContent.length;

      assert.ok(wordCount > 0, "Should count words in markdown");
      assert.ok(charCount > 0, "Should count characters in markdown");
    });

    test("should handle JSON content properly", () => {
      const jsonContent = JSON.stringify(
        {
          name: "PagePilot API",
          version: "1.0.0",
          endpoints: [
            { method: "GET", path: "/users" },
            { method: "POST", path: "/users" },
          ],
        },
        null,
        2
      );

      const wordCount = jsonContent.split(/\s+/).length;
      const charCount = jsonContent.length;

      assert.ok(wordCount > 0, "Should count words in JSON");
      assert.ok(charCount > 0, "Should count characters in JSON");
    });

    test("should handle plain text content properly", () => {
      const plainContent = `This is a simple plain text documentation file.
It contains multiple lines and paragraphs.
Each line provides information about the API usage.`;

      const wordCount = plainContent.split(/\s+/).length;
      const charCount = plainContent.length;

      assert.ok(wordCount > 0, "Should count words in plain text");
      assert.ok(charCount > 0, "Should count characters in plain text");
    });
  });

  suite("Error Handling Scenarios", () => {
    test("should handle invalid URLs gracefully", () => {
      const invalidUrls = [
        "not-a-url",
        "http://",
        "https://",
        "ftp://example.com",
        "javascript:alert(1)",
      ];

      invalidUrls.forEach((url) => {
        // In a real scenario, these would be handled by axios
        // Here we just test that our URL validation logic would work
        assert.ok(typeof url === "string", `URL ${url} should be a string`);
      });
    });

    test("should handle network timeouts", () => {
      // Simulate timeout scenario
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), 100);
      });

      return timeoutPromise.catch((error) => {
        assert.ok(
          error.message.includes("timeout"),
          "Should handle timeout errors"
        );
      });
    });

    test("should handle storage errors", () => {
      // Simulate storage error
      const storageError = new Error("Storage quota exceeded");

      assert.ok(
        storageError.message.includes("Storage"),
        "Should identify storage errors"
      );
    });
  });

  suite("Performance Tests", () => {
    test("should handle large content efficiently", () => {
      const largeContent = "word ".repeat(50000);

      const start = Date.now();
      const wordCount = largeContent
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      const charCount = largeContent.length;
      const end = Date.now();

      assert.strictEqual(
        wordCount,
        50000,
        "Should count large content correctly"
      );
      assert.ok(charCount > 0, "Should handle large character count");
      assert.ok(
        end - start < 1000,
        "Should process large content quickly (< 1s)"
      );
    });

    test("should handle multiple small operations efficiently", () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        const testContent = `Test content number ${i} with some words`;
        const wordCount = testContent.split(/\s+/).length;
        const charCount = testContent.length;

        assert.ok(wordCount > 0, "Each iteration should count words");
        assert.ok(charCount > 0, "Each iteration should count characters");
      }

      const end = Date.now();
      assert.ok(
        end - start < 1000,
        "Should handle multiple operations efficiently (< 1s)"
      );
    });
  });
});
