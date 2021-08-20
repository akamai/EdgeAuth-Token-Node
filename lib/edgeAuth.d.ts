type Algorithm = "sha256" | "sha1" | "md5";
type Options = {
  tokenName?: string;
  key: string;
  algorithm?: Algorithm | Uppercase<Algorithm>;
  salt?: string;
  startTime?: number | "now";
  endTime?: number;
  windowSeconds?: number;
  fieldDelimiter?: string;
  aclDelimiter?: string;
  escapeEarly?: boolean;
  verbose?: boolean;
};
type HasDefaultKeys = "tokenName" | "algorithm" | "escapeEarly" | "fieldDelimiter" | "aclDelimiter" | "verbose";
type InitializedOptions = Required<Pick<Options, HasDefaultKeys>> & Omit<Options, HasDefaultKeys>;

export class EdgeAuth {
  options: InitializedOptions;
  constructor(options: Options);
  generateACLToken(acl: string | string[]): string;
  generateURLToken(url: string): string;
}
