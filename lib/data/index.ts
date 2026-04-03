import { appConfig } from "@/lib/config/app";
import appsScriptRepository from "@/lib/data/adapters/apps-script";
import localRepository from "@/lib/data/adapters/local";

export function getRepository() {
  return appConfig.dataSource === "apps-script"
    ? appsScriptRepository
    : localRepository;
}
