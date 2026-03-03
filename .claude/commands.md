# Custom Commands

## component
Create a new Next.js server component in `/components` with:
- TypeScript, Props interface, Tailwind, JSDoc.

## action
Create a new Server Action in `/lib/actions` with:
- "use server", Zod validation, try-catch, Return: `{ success: boolean, data?: any, error?: string }`, revalidatePath.

## schema
Create a Zod schema in `/lib/validations`:
- camelCase name, export inferred type, descriptive errors, non-negative financial checks.

## page
Create page/layout in `/app`:
- Server Component, Suspense + Skeletons, Metadata, Responsive.
