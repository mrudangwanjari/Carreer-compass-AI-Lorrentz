"""
build_index.py
──────────────
One-time script to encode all 123,849 job postings with SBERT
and save the FAISS index so the API can do sub-second retrieval.

Run from LorrentzFM/ root:
    python -m backend.build_index

Takes ~10-15 min on CPU. The index is saved to:
    BERT/bert_experiment/data/job_embeddings.index

After this, the API will use FAISS for all recommendations.
"""
import json
import logging
import time
from pathlib import Path

import numpy as np
import pandas as pd
import faiss
from sentence_transformers import SentenceTransformer

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(message)s")
log = logging.getLogger(__name__)

ROOT      = Path(__file__).resolve().parent.parent
POSTINGS  = ROOT / "dataset" / "postings.csv"
OUT_DIR   = ROOT / "BERT" / "bert_experiment" / "data"
OUT_INDEX = OUT_DIR / "job_embeddings.index"
FAISS_MAP = OUT_DIR / "faiss_id_map.json"
BATCH     = 512


def main():
    log.info("Loading SBERT model…")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    log.info("Loading postings from %s…", POSTINGS)
    df = pd.read_csv(
        POSTINGS,
        usecols=["job_id", "title", "description"],
        on_bad_lines="skip", low_memory=False,
    )
    log.info("Loaded %d postings", len(df))

    # Build ordered job_id list (FAISS index order)
    if FAISS_MAP.exists():
        log.info("Loading existing FAISS ID map…")
        with open(FAISS_MAP) as f:
            fmap = json.load(f)
        ordered_ids = [fmap[str(i)] for i in range(len(fmap))]
        df = df.set_index("job_id").reindex(ordered_ids).reset_index()
    else:
        ordered_ids = df["job_id"].tolist()

    texts = (df["title"].fillna("") + " " + df["description"].fillna("")).tolist()
    log.info("Encoding %d texts in batches of %d…", len(texts), BATCH)

    t0    = time.time()
    all_embs = model.encode(
        texts,
        batch_size     = BATCH,
        show_progress_bar = True,
        normalize_embeddings = True,
        convert_to_numpy = True,
    ).astype("float32")
    log.info("Encoded in %.1f min", (time.time() - t0) / 60)

    log.info("Building FAISS FlatIP index (%d × %d)…", len(texts), all_embs.shape[1])
    index = faiss.IndexFlatIP(all_embs.shape[1])
    index.add(all_embs)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(OUT_INDEX))
    log.info("Index saved to %s", OUT_INDEX)

    # Save FAISS map if not already present
    if not FAISS_MAP.exists():
        fmap = {str(i): int(jid) for i, jid in enumerate(ordered_ids)}
        with open(FAISS_MAP, "w") as f:
            json.dump(fmap, f)
        log.info("FAISS map saved to %s", FAISS_MAP)

    log.info("Done! Re-start the API server to activate FAISS retrieval.")


if __name__ == "__main__":
    main()
