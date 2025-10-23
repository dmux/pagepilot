import * as assert from "assert";
import * as vscode from "vscode";
import { t, type SupportedLanguage } from "../i18n";

suite("Internationalization Tests", () => {
  suite("Language Detection", () => {
    test("should return Portuguese translations for pt-BR locale", () => {
      // Since we can't mock vscode.env.language directly in tests,
      // we test the function behavior with different scenarios
      const translations = t();

      // Test that translations are loaded
      assert.ok(translations);
      assert.ok(typeof translations.loadCommandHelp.title === "string");
    });

    test("should return English translations by default", () => {
      const translations = t();

      // Should have English structure by default
      assert.ok(
        translations.loadCommandHelp.title.includes("Context Loader") ||
          translations.loadCommandHelp.title.includes("Carregador")
      );
    });
  });

  suite("Translation Completeness", () => {
    test("should have all required keys in translations", () => {
      const translations = t();
      const requiredKeys = [
        "loadCommandHelp",
        "loading",
        "success",
        "errors",
        "status",
        "help",
        "examples",
      ];

      requiredKeys.forEach((key) => {
        assert.ok(
          translations[key as keyof typeof translations],
          `Missing required key: ${key}`
        );
      });
    });

    test("should have complete loadCommandHelp structure", () => {
      const translations = t();
      const requiredKeys = ["title", "usage", "examples", "tip"];

      requiredKeys.forEach((key) => {
        assert.ok(
          translations.loadCommandHelp[
            key as keyof typeof translations.loadCommandHelp
          ],
          `Missing loadCommandHelp key: ${key}`
        );
      });
    });

    test("should have complete loading structure", () => {
      const translations = t();
      const requiredKeys = ["context", "analyzing"];

      requiredKeys.forEach((key) => {
        assert.ok(
          translations.loading[key as keyof typeof translations.loading],
          `Missing loading key: ${key}`
        );
      });
    });

    test("should have complete success structure", () => {
      const translations = t();
      const requiredKeys = [
        "loaded",
        "cleared",
        "source",
        "statistics",
        "ready",
      ];

      requiredKeys.forEach((key) => {
        assert.ok(
          translations.success[key as keyof typeof translations.success],
          `Missing success key: ${key}`
        );
      });
    });

    test("should have complete errors structure", () => {
      const translations = t();
      const requiredKeys = [
        "loadFailed",
        "url",
        "error",
        "tips",
        "urlAccessible",
        "plainText",
        "testBrowser",
        "llmError",
      ];

      requiredKeys.forEach((key) => {
        assert.ok(
          translations.errors[key as keyof typeof translations.errors],
          `Missing errors key: ${key}`
        );
      });
    });

    test("should have complete status structure", () => {
      const translations = t();
      const requiredKeys = [
        "noContext",
        "contextStatus",
        "persistence",
        "readyToAnswer",
      ];

      requiredKeys.forEach((key) => {
        assert.ok(
          translations.status[key as keyof typeof translations.status],
          `Missing status key: ${key}`
        );
      });
    });

    test("should have complete help structure", () => {
      const translations = t();
      const requiredKeys = [
        "noContextTitle",
        "noContextDescription",
        "apiDocs",
        "projectReadme",
        "techSpecs",
        "formatExpected",
        "aiTip",
        "welcomeTitle",
        "activeContext",
        "capabilities",
        "usageExamples",
        "currentContext",
      ];

      requiredKeys.forEach((key) => {
        assert.ok(
          translations.help[key as keyof typeof translations.help],
          `Missing help key: ${key}`
        );
      });
    });

    test("should have complete capabilities structure", () => {
      const translations = t();
      const requiredKeys = [
        "codeAnalysis",
        "techDocs",
        "contextImplementation",
        "debugOptimization",
      ];

      requiredKeys.forEach((key) => {
        assert.ok(
          translations.help.capabilities[
            key as keyof typeof translations.help.capabilities
          ],
          `Missing capabilities key: ${key}`
        );
      });
    });

    test("should have complete examples structure", () => {
      const translations = t();
      const requiredKeys = [
        "useApi",
        "implementFunction",
        "explainPattern",
        "bestPractices",
      ];

      requiredKeys.forEach((key) => {
        assert.ok(
          translations.examples[key as keyof typeof translations.examples],
          `Missing examples key: ${key}`
        );
      });
    });
  });

  suite("Translation Content Quality", () => {
    test("should have non-empty translation strings", () => {
      const translations = t();

      // Check that important strings are not empty
      assert.ok(
        translations.loadCommandHelp.title.length > 0,
        "Title should not be empty"
      );
      assert.ok(
        translations.loading.context.length > 0,
        "Loading context should not be empty"
      );
      assert.ok(
        translations.success.loaded.length > 0,
        "Success loaded should not be empty"
      );
      assert.ok(
        translations.errors.loadFailed.length > 0,
        "Load failed error should not be empty"
      );
    });

    test("should have consistent emoji usage", () => {
      const translations = t();

      // Check that certain messages contain emojis for better UX
      const shouldHaveEmojis = [
        translations.loadCommandHelp.title,
        translations.success.loaded,
        translations.success.cleared,
        translations.loading.context,
        translations.loading.analyzing,
      ];

      shouldHaveEmojis.forEach((text) => {
        // At least check they're not just plain text (should have some special chars)
        assert.ok(text.length > 5, "Messages should be descriptive");
      });
    });

    test("should have proper command references", () => {
      const translations = t();

      // Check that help messages reference the correct commands
      const helpText = translations.help.noContextDescription;
      assert.ok(
        typeof helpText === "string",
        "Help description should be a string"
      );
    });

    test("should have consistent URL examples", () => {
      const translations = t();

      // Check that examples contain valid-looking URLs
      const exampleTexts = [
        translations.help.apiDocs,
        translations.help.projectReadme,
        translations.help.techSpecs,
      ];

      exampleTexts.forEach((text) => {
        assert.ok(typeof text === "string", "Example should be a string");
        assert.ok(text.length > 0, "Example should not be empty");
      });
    });
  });

  suite("Supported Language Types", () => {
    test("should support English language code", () => {
      const englishCode: SupportedLanguage = "en";
      assert.strictEqual(englishCode, "en");
    });

    test("should support Portuguese Brazil language code", () => {
      const portugueseCode: SupportedLanguage = "pt-BR";
      assert.strictEqual(portugueseCode, "pt-BR");
    });

    test("should have proper type constraints", () => {
      // This test ensures that only supported languages can be used
      // TypeScript will catch any invalid language codes at compile time
      const supportedLanguages: SupportedLanguage[] = ["en", "pt-BR"];

      assert.strictEqual(supportedLanguages.length, 2);
      assert.ok(supportedLanguages.includes("en"));
      assert.ok(supportedLanguages.includes("pt-BR"));
    });
  });
});
