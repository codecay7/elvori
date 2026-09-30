export const DEFAULT_LATEX = String.raw`\documentclass[11pt,a4paper]{article}

\usepackage[margin=1in]{geometry}
\usepackage{hyperref}
\usepackage{enumitem}

\begin{document}

\begin{center}
    {\LARGE \textbf{Your Name}}\\
    \vspace{4pt}
    Software Engineer
\end{center}

\section*{Experience}

\textbf{Software Engineer} \hfill 2025 -- Present

\begin{itemize}[leftmargin=*]
    \item Built scalable web applications using modern technologies.
    \item Collaborated with engineering teams to deliver production features.
\end{itemize}

\section*{Projects}

\textbf{Elvori}
\begin{itemize}[leftmargin=*]
    \item Conversational LaTeX document workspace.
\end{itemize}

\section*{Education}

Bachelor of Computer Applications

\end{document}`;
