FROM texlive/texlive:latest

RUN useradd \
      --create-home \
      --uid 10001 \
      --shell /usr/sbin/nologin \
      elvori

WORKDIR /work

USER 10001:10001

ENV HOME=/tmp \
    TEXMFHOME=/tmp/texmf \
    TEXMFVAR=/tmp/texmf-var
