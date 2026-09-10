-- Postgres encode() no acepta 'base64url'. El default de person_qr rompía
-- la inscripción pública (novo_register_ticket).
alter table person_qr
  alter column qr_token set default
    replace(replace(rtrim(encode(gen_random_bytes(24), 'base64'), '='), '+', '-'), '/', '_');
