export async function POST(req) {
  const { predictions } = await req.json();

  if (predictions && predictions.length > 0) {
    const simulatedResponse = predictions.map((pred) => ({
      class: pred.class,
      bbox: pred.bbox,
    }));
    return new Response(JSON.stringify(simulatedResponse), {
      status: 200,
    });
  } else {
    return new Response(JSON.stringify([]), {
      status: 200,
    });
  }
}
