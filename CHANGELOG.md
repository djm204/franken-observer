# Changelog

## [0.2.0](https://github.com/djm204/franken-observer/compare/observer-v0.1.0...observer-v0.2.0) (2026-03-06)


### Features

* **adapters:** BatchAdapter bulk export — PR-16 (FB-17) ([2e9ce72](https://github.com/djm204/franken-observer/commit/2e9ce726e80cd877b189c4a5fbf0d4821cd7bf60))
* **adapters:** external adapters — PR-06 (FB-07) ([aa0c8f7](https://github.com/djm204/franken-observer/commit/aa0c8f7a7f9c5be7b97ec30b63108c339a5a4fd3))
* **adapters:** Grafana Tempo adapter — PR-07 (FB-08) ([6020402](https://github.com/djm204/franken-observer/commit/60204027b0abd93e96fc3dd0dcd6b8160e4ede40))
* **adapters:** MultiAdapter fan-out — PR-12 (FB-13) ([c7b826e](https://github.com/djm204/franken-observer/commit/c7b826e927b07d04d2d2f9ad315da4f1fec94d81))
* **core:** core tracing + OTEL serialiser — PR-01 (FB-01) ([a3c96c4](https://github.com/djm204/franken-observer/commit/a3c96c4e0a648306bf2ab7cc41c366d2235aaf7f))
* **cost:** add codex CLI model to default pricing table ([05a33d3](https://github.com/djm204/franken-observer/commit/05a33d3e5451f8cbe561623f741df2794161c822))
* **cost:** token counting, cost calc, circuit breaker — PR-02 (FB-02) ([111ea6d](https://github.com/djm204/franken-observer/commit/111ea6d7a0c0951e45a1775ac1d345a57a7d7acd))
* **evals:** evaluation framework — PR-04 (FB-04 + FB-05) ([763e382](https://github.com/djm204/franken-observer/commit/763e382270baa892c9a9971ce8583e270ddfefbb))
* **export:** OTEL export interface + SQLite adapter — PR-03 (FB-03) ([4519ec1](https://github.com/djm204/franken-observer/commit/4519ec10524af093d42497e47c1da531908bce36))
* **grafana:** Grafana dashboard JSON generator — PR-10 (FB-11) ([8f55927](https://github.com/djm204/franken-observer/commit/8f559271f4377638db110990af51bccce97b9594))
* **incident:** incident response — PR-05 (FB-06) ([df00e8a](https://github.com/djm204/franken-observer/commit/df00e8a93985f9bf3e3a5ddcc6edb791ffed4be3))
* **notify:** HITL webhook delivery — PR-08 (FB-09) ([fab0655](https://github.com/djm204/franken-observer/commit/fab0655949b8376049609266d8777b6fa155e81a))
* **notify:** WebhookNotifier retry with exponential backoff — PR-11 (FB-12) ([185eba3](https://github.com/djm204/franken-observer/commit/185eba3b1a0e9d3d7b52de6f5338de6cf44d63ba))
* **propagation:** W3C Trace Context propagation — PR-14 (FB-15) ([1b7055d](https://github.com/djm204/franken-observer/commit/1b7055dc1106d50685580897f2974824e5efe42e))
* **redaction:** SpanRedactor middleware — PR-15 (FB-16) ([3f31fb5](https://github.com/djm204/franken-observer/commit/3f31fb54ff08f2648f580ca1596681a355ceffcc))
* **sampling:** trace sampling — PR-13 (FB-14) ([0496ff4](https://github.com/djm204/franken-observer/commit/0496ff46b02f02d83771a9e87f30d20947d51bbe))
* **scaffold:** project scaffold — PR-00 (FB-00) ([a848abe](https://github.com/djm204/franken-observer/commit/a848abe9ec742dbcd980796b9a60b295a2bc07ef))
* **ui:** web UI for trace visualisation — PR-09 (FB-10) ([fa76ace](https://github.com/djm204/franken-observer/commit/fa76ace0bd71673edabd10276ac270721f851eec))


### Documentation

* add comprehensive README with usage examples for all modules ([03bc09d](https://github.com/djm204/franken-observer/commit/03bc09d0d8906640851220f89ff92de34298f689))
* add project identity, implementation plan, and cursor rules ([456c8ae](https://github.com/djm204/franken-observer/commit/456c8ae7d90c5860f86c05ab6bb48633248aceb8))
* add RAMP_UP.md for agent onboarding ([c1ccad5](https://github.com/djm204/franken-observer/commit/c1ccad553ba45ecb9e35434c44d583d3ab1d48c9))
* **plan:** add PR-11 webhook retry with exponential backoff to implementation plan ([c54b157](https://github.com/djm204/franken-observer/commit/c54b15767bf23cb122582ce013d7557edfde512b))


### CI/CD

* add release-please config and workflow ([722dc79](https://github.com/djm204/franken-observer/commit/722dc7924af278158e13a332aef26c704fb112e7))
