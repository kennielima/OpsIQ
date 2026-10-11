using OpsIq.Core.Chunking;

namespace OpsIq.Infrastructure.Chunking;

public class FixedSizeChunker : IChunker
{
    private const int ChunkSize = 1000;
    private const int Overlap = 100;
    public IReadOnlyList<string> Chunk(string text)
    {
        var chunks = new List<string>();
        if (string.IsNullOrWhiteSpace(text)) return chunks;

        var start = 0;
        while (start < text.Length)
        {
            var length = Math.Min(ChunkSize, text.Length - start);
            chunks.Add(text.Substring(start, length));
            start += ChunkSize - Overlap;
        }
        return chunks;
    }
}