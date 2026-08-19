/**
 * The client-book dataset is a tree: a company holds branches, a branch holds
 * employees, and an employee holds acquisition channels. The nesting is not
 * uniform — e.g. a branch may have no employees, and an employee may have no
 * channels — so only one of `branches` / `employees` / `channels` is ever
 * present on a given node, and any of them may be absent entirely.
 */
export interface ClientNode {
  id: string;
  name: string;
  /** 12 monthly figures, aligned with `CompanyResponse.months`. */
  values: number[];
  branches?: ClientNode[];
  employees?: ClientNode[];
  channels?: ClientNode[];
}

export interface CompanyResponse {
  /** Human-readable month labels, aligned index-for-index with every node's `values`. */
  months: string[];
  company: ClientNode;
}
