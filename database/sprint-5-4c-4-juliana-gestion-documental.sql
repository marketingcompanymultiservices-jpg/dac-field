update public.profiles
set
  rol = 'Gestion Documental',
  activo = true
where lower(correo) in (
  'juliana@doblealtura.com',
  'juliana@doblealturaconstrucciones.com.co'
);
