type Merge<T, U> = {
    [K in keyof T | keyof U]: K extends keyof U
        ? U[K]
        : K extends keyof T
          ? T[K]
          : never;
};
type RequiredKeys<T, K extends keyof T> = Merge<T, { [P in K]: T[P] }>;
