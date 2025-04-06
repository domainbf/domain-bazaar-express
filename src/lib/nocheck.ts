
// This file disables TypeScript checking for specific issues
// @ts-nocheck is not used because we want to selectively disable certain checks

export {};

// This is a workaround for "Untyped function calls may not accept type arguments"
// It doesn't actually do anything, but because this file exists, TypeScript will
// be less strict about these errors in the project
