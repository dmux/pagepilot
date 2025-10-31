import * as vscode from "vscode";
import { HttpsProxyAgent } from "https-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";
import axios from "axios";

/**
 * Configura o axios para usar as configurações de proxy do VS Code
 */
export function getProxyConfig(): any {
  const config = vscode.workspace.getConfiguration("http");
  const proxyUrl = config.get<string>("proxy");
  const proxyStrictSSL = config.get<boolean>("proxyStrictSSL", true);
  const proxyAuthorization = config.get<string>("proxyAuthorization");

  if (!proxyUrl) {
    return {};
  }

  const axiosConfig: any = {
    proxy: false, // Desabilita proxy automático do axios
  };

  try {
    const url = new URL(proxyUrl);

    // Adiciona autorização se configurada
    if (proxyAuthorization) {
      url.username = "";
      url.password = "";
      // A autorização será passada via headers
    }

    // Configura o agente apropriado baseado no protocolo
    if (url.protocol === "https:") {
      axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl, {
        rejectUnauthorized: proxyStrictSSL,
      });
    } else {
      axiosConfig.httpAgent = new HttpProxyAgent(proxyUrl);
    }

    // Adiciona headers de autorização se necessário
    if (proxyAuthorization) {
      axiosConfig.headers = {
        "Proxy-Authorization": proxyAuthorization,
      };
    }
  } catch (error) {
    console.warn("Configuração de proxy inválida:", error);
  }

  return axiosConfig;
}

/**
 * Verifica se o proxy está configurado no VS Code
 */
export function isProxyConfigured(): boolean {
  const config = vscode.workspace.getConfiguration("http");
  const proxyUrl = config.get<string>("proxy");
  return !!proxyUrl;
}
