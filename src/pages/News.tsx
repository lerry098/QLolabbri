import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { Page } from "../components/Layout";
export function NewsDetail() {
  const { slug = "" } = useParams();
  const query = useQuery({
    queryKey: ["article", slug],
    queryFn: () => api.article(slug),
    retry: false,
  });
  const related = useQuery({ queryKey: ["news"], queryFn: api.news });
  if (query.isPending)
    return (
      <Page title="Berita">
        <p role="status">Memuat artikel…</p>
      </Page>
    );
  if (query.error)
    return (
      <Page title="Artikel belum tersedia">
        <div role="alert" className="notice error">
          {query.error.message}
        </div>
        <button className="button" onClick={() => void query.refetch()}>
          Coba lagi
        </button>
      </Page>
    );
  const article = query.data;
  return (
    <Page title={article.title}>
      <p className="article-date">
        {article.category} ·{" "}
        <time dateTime={article.publicationDate}>
          {new Intl.DateTimeFormat("id-ID", {
            dateStyle: "long",
            timeZone: "Asia/Jakarta",
          }).format(new Date(article.publicationDate))}
        </time>
      </p>
      <img
        className="article-cover"
        src={article.image}
        alt={article.title}
        onError={(event) => {
          if (!event.currentTarget.src.endsWith("/assets/news.svg"))
            event.currentTarget.src = "/assets/news.svg";
        }}
      />
      <div className="article-body">
        {article.content.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
      <Link className="outline-button" to="/#news">
        Kembali ke Berita
      </Link>
      <aside className="related-articles">
        <h2>Artikel Terkait</h2>
        {related.isError ? (
          <button
            className="text-button"
            onClick={() => void related.refetch()}
          >
            Muat ulang artikel terkait
          </button>
        ) : (
          related.data
            ?.filter((item) => item.id !== article.id)
            .slice(0, 3)
            .map((item) => (
              <Link key={item.id} to={`/news/${item.slug}`}>
                {item.title}
              </Link>
            ))
        )}
      </aside>
    </Page>
  );
}
