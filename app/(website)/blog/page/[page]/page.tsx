import BlogPage, {
  generateMetadata as generateBlogMetadata,
} from "../../page";

type Props = {
  params: Promise<{ page: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata(props: Props) {
  const [{ page }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  return generateBlogMetadata({
    searchParams: Promise.resolve({ ...searchParams, page, _clean: "1" }),
  });
}

export default async function PaginatedBlogPage(props: Props) {
  const [{ page }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  return BlogPage({
    searchParams: Promise.resolve({ ...searchParams, page, _clean: "1" }),
  });
}
